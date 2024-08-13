// build:
// emcc -O3 item.c -o item.js -s WASM=1 -s EXPORT_NAME="'ItemGeneratorModule'" -s MODULARIZE=1 -gsource-map
// import:
// <script src="item.js"></script>
// script:
// await new ItemGeneratorModule()

#include <emscripten/emscripten.h>

#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "prng.h"

typedef int32_t ig_int;

static const ig_int ERR_MEM = -1;
static const ig_int ERR_LEN = -2;
static const ig_int ERR_WHI = -3;
static const ig_int ERR_PI1 = -4;
static const ig_int ERR_PI2 = -5;
static const ig_int ERR_NON = -6;
static const ig_int ERR_PI3 = -7;
static const ig_int ERR_SAN1 = -8;
static const ig_int ERR_SAN2 = -9;
static const ig_int ERR_SAN3 = -10;
static const ig_int ERR_SAN4 = -11;
static const ig_int ERR_SAN5 = -12;
static const ig_int ERR_SAN6 = -13;
static const ig_int ERR_NON1 = -14;
static const ig_int ERR_NON2 = -15;
static const ig_int ERR_NON3 = -16;
static const ig_int ERR_NON4 = -17;
static const ig_int ERR_NON5 = -18;

#define IG_FN inline static

/**
In Diablo 2, affixes (e.g. "of Strength") are assigned to a group.
Affixes in the same group are mutually exclusive.
Each affix can have up to 3 effects with 4 parameters:
  'min', 'max', code ('aff'), param ('par').
Each affix has an associated frequency to determine probability.
'weight' is a prefix sum of the frequency for each group and member(s).
Every possible group and member is provided in a single list.
Like a heap/tree, children are located at the 'offset' with 'length'.
If an affix cannot contribute to the target,
  any group with an 'offset' < 0 will be skipped.
*/

struct effect {
  ig_int min;
  ig_int max;
  ig_int aff;
  ig_int par;
};

struct group {
  ig_int weight;
  ig_int offset;
  ig_int length;
  struct effect* effects;
};

EMSCRIPTEN_KEEPALIVE ig_int ig_sanity_check(struct group* groups, ig_int length) {
  if (!groups || length <= 0) {
    return ERR_SAN1;
  }
  struct group* last = NULL;
  for (int32_t i = 0; i < length; ++i) {
    if (groups[i].length <= 0) {
      return ERR_SAN2;
    }
    if (i > 0 && groups[i].weight <= groups[i - 1].weight) {
      return ERR_SAN3;
    }
    for (int32_t j = 0; j < groups[i].length; ++j) {
      struct group* group = &groups[groups[i].offset + j];
      if (!group->effects || group->length <= 0) {
        return ERR_SAN4;
      }
      if (j > 0 && group->weight <= (group - 1)->weight) {
        return ERR_SAN5;
      }
      for (int32_t k = 0; k < group->length; ++k) {
        if (group->effects[k].min <= 0 || group->effects[k].aff <= 0) {
          return ERR_SAN6;
        }
      }
    }
  }
  return 0;
}

EMSCRIPTEN_KEEPALIVE void ig_print_effects(struct effect* effects, ig_int length) {
  for (int32_t i = 0; i < length; ++i) {
    printf("effect min=%d max=%d aff=%d par=%d\n", effects[i].min, effects[i].max, effects[i].aff, effects[i].par);
  }
}

EMSCRIPTEN_KEEPALIVE void ig_print_group(struct group* groups, ig_int length) {
  for (int32_t i = 0; i < length; ++i) {
    printf("group1 weight=%d offset=%d length=%d effects=%p\n", groups[i].weight, groups[i].offset, groups[i].length, groups[i].effects);
    for (int32_t j = 0; j < groups[i].length; ++j) {
      struct group* group = &groups[groups[i].offset + j];
      printf("group2 weight=%d offset=%d length=%d effects=%p\n", group->weight, group->offset, group->length, group->effects);
      if (!group->effects) {
        printf("no effects?\n");
      } else {
        ig_print_effects(group->effects, group->length);
      }
    }
  }
}

IG_FN ig_int ig_prng(ig_int min, ig_int max) {
  if (max - min <= 1) {
    return min;
  }
  return (next() % (max - min)) + min;
}

IG_FN void ig_decrement(struct effect* summary, ig_int length, struct effect* effect) {
  for (int32_t i = 0; i < length; ++i) {
    if (summary[i].aff == effect->aff && summary[i].par == effect->par) {
      ig_int amt = ig_prng(effect->min, effect->max);
      summary[i].min -= amt;
      break;
    }
  }
}

IG_FN int32_t ig_pass(struct group** selected, ig_int length1, struct effect* summary, ig_int length2, struct effect* scratch, struct effect* extras, ig_int length3, ig_int* histogram, const size_t capacity) {
  memcpy(scratch, summary, sizeof(struct group) * length2);
  for (int32_t i = 0; i < length1 && selected[i]; ++i) {
    if (selected[i]->offset >= 0) {
      for (int32_t j = 0; j < selected[i]->length; ++j) {
        ig_decrement(scratch, length2, &selected[i]->effects[j]);
      }
    }
  }
  for (int32_t i = 0; i < length3; ++i) {
    ig_decrement(scratch, length2, &extras[i]);
  }
  if (histogram) {
    for (int32_t i = 0; i < length2; ++i) {
      ig_int val = summary[i].min - scratch[i].min;
      summary[i].max += val;
      if (val < capacity) {
        histogram[i * capacity + val] = histogram[i * capacity + val] + 1;
      }
    }
  }
  for (int32_t i = 0; i < length2; ++i) {
    if (scratch[i].min > 0) {
      return 0;
    }
  }
  return 1;
}

ig_int ig_which_sequential(struct group* group, ig_int length, ig_int random) {
  for (int32_t i = 0; i < length; ++i) {
    if (random < group[i].weight) {
      return i;
    }
  }
  return ERR_WHI;
}

ig_int ig_which_binary(struct group* group, ig_int length, ig_int random) {
  ig_int lb = 0;
  ig_int ub = length;
  ig_int range = ub;
  while (range > 0) {
    ig_int half = range >> 1;
    if (random >= group[lb + half].weight) {
      lb += half + 1;
      range -= half + 1;
    } else {
      range = half;
    }
  }
  if (random >= group[lb].weight) {
    return ERR_WHI;
  }
  return lb;
}

ig_int (*ig_which)(struct group* group, ig_int length, ig_int random) = ig_which_binary;

IG_FN ig_int ig_pick(struct group* group, ig_int length, struct group** res, struct group** parent) {
  ig_int limit = length << 3;
  while (limit--) {
    ig_int max = group[length - 1].weight;
    ig_int random = ig_prng(0, max);
    ig_int k = ig_which(group, length, random);
    if (k < 0) {
      return ERR_PI1;
    }
    if (group[k].offset < 0) {
      continue;
    }
    if (k > 0) {
      random -= group[k - 1].weight;
    }
    ig_int m = ig_which(&group[group[k].offset], group[k].length, random);
    if (m < 0) {
      return ERR_PI2;
    }
    m += group[k].offset;
    *parent = &group[k];
    *res = &group[m];
    break;
  }
  if (limit <= 0) {
    return ERR_PI3;
  }
  return 0;
}

IG_FN ig_int ig_select(ig_int count, struct group* group, ig_int length, struct group** res, struct group** parents) {
  ig_int err = 0;
  for (int32_t i = 0; i < count && i < length; ++i) {
    if ((err = ig_pick(group, length, &res[i], &parents[i]))) {
      for (int32_t j = 0; j < i; ++j) {
        parents[j]->offset = -parents[j]->offset;
      }
      return err;
    }
    parents[i]->offset = -parents[i]->offset;
  }
  for (int32_t i = 0; i < count && i < length; ++i) {
    parents[i]->offset = -parents[i]->offset;
  }
  return 0;
}

IG_FN ig_int ig_simulate(ig_int* counts, struct group** groups, ig_int* lengths, ig_int length1, struct group** selected, struct group** selectedParents) {
  ig_int err = 0;
  struct group** root = selected;
  struct group** rootParents = selectedParents;
  for (int32_t i = 0; i < length1; ++i) {
    if ((err = ig_select(counts[i], groups[i], lengths[i], root, rootParents))) {
      return err;
    }
    root += counts[i];
    rootParents += counts[i];
  }
  return 0;
}

static ig_int allocs = 0;

EMSCRIPTEN_KEEPALIVE void* ig_alloc(int32_t size) {
  void* ptr = malloc(size);
  if (!ptr) {
    return 0;
  }
  ++allocs;
  memset(ptr, 0, size);
  return ptr;
}

EMSCRIPTEN_KEEPALIVE void ig_free(void* ptr) {
  --allocs;
  free(ptr);
}

EMSCRIPTEN_KEEPALIVE ig_int ig_alloc_count() {
  return allocs;
}

EMSCRIPTEN_KEEPALIVE ig_int ig_generate(ig_int amount, ig_int* counts, struct group** groups, ig_int* lengths, ig_int length1, struct effect* summary, ig_int length2, ig_int* seed, struct effect* extras, ig_int length4, ig_int** hist, size_t capacity) {
  if (!seed) {
    return ERR_NON1;
  }

  for (int32_t i = 0; i < 4; ++i) {
    s[i] = seed[i];
  }
  jump();

  if (length1 <= 0) {
    return ERR_NON2;
  }

  if (!summary || length2 <= 0) {
    return ERR_NON3;
  }

  if (!extras && length4 > 0) {
    return ERR_NON4;
  }

  ig_int length3 = 0;

  for (int32_t i = 0; i < length1; ++i) {
    if (lengths[i] <= 0 || counts[i] <= 0 || !groups[i]) {
      return ERR_NON5;
    }
    length3 += counts[i];
  }

  if (length3 <= 0) {
    return ERR_LEN;
  }

  struct group** selected = (struct group**)malloc(sizeof(struct group*) * length3);
  struct group** selectedParents = (struct group**)malloc(sizeof(struct group*) * length3);
  struct effect* scratch = (struct effect*)malloc(sizeof(struct effect) * length2);

  if (!selected || !selectedParents || !scratch) {
    free(selected);
    free(selectedParents);
    free(scratch);
    return ERR_MEM;
  }

  ig_int* histogram = NULL;
  if (hist) {
    histogram = (ig_int*)ig_alloc(length2 * capacity * sizeof(ig_int));
  }

  ig_int res = 0, err = 0;
  for (int32_t i = 0; i < amount; ++i) {
    if ((err = ig_simulate(counts, groups, lengths, length1, selected, selectedParents))) {
      res = err;
      break;
    }
    res += ig_pass(selected, length3, summary, length2, scratch, extras, length4, histogram, capacity);
  }

  if (hist) {
    *hist = histogram;
  }

  free(selected);
  free(selectedParents);
  free(scratch);

  return res;
}

EMSCRIPTEN_KEEPALIVE ig_int ig_get_size_group() {
  return sizeof(struct group);
}

EMSCRIPTEN_KEEPALIVE ig_int ig_get_size_effect() {
  return sizeof(struct group);
}

EMSCRIPTEN_KEEPALIVE struct group** ig_prepare_group_list(ig_int length) {
  struct group** groups = (struct group**)ig_alloc(sizeof(struct group*) * length);
  return groups;
}

EMSCRIPTEN_KEEPALIVE struct group* ig_prepare_group(ig_int length) {
  struct group* group = (struct group*)ig_alloc(sizeof(struct group) * length);
  return group;
}

EMSCRIPTEN_KEEPALIVE struct effect* ig_prepare_effects(ig_int length) {
  struct effect* effects = (struct effect*)ig_alloc(sizeof(struct effect) * length);
  return effects;
}

EMSCRIPTEN_KEEPALIVE ig_int* ig_prepare_ints(ig_int length) {
  ig_int* ints = (ig_int*)ig_alloc(sizeof(ig_int) * length);
  return ints;
}

EMSCRIPTEN_KEEPALIVE struct group** ig_skip_group_list(struct group** groups, ig_int length) {
  return groups + length;
}

EMSCRIPTEN_KEEPALIVE struct group* ig_skip_group(struct group* group, ig_int length) {
  return group + length;
}

EMSCRIPTEN_KEEPALIVE struct effect* ig_skip_effects(struct effect* effects, ig_int length) {
  return effects + length;
}

EMSCRIPTEN_KEEPALIVE ig_int* ig_skip_ints(ig_int* ints, ig_int length) {
  return ints + length;
}

EMSCRIPTEN_KEEPALIVE void ig_assign_group_list(struct group** groups, ig_int idx, struct group* group) {
  groups[idx] = group;
}

EMSCRIPTEN_KEEPALIVE void ig_assign_group(struct group* group, ig_int idx, ig_int weight, ig_int offset, ig_int length, struct effect* effects) {
  group[idx].weight = weight;
  group[idx].offset = offset;
  group[idx].length = length;
  group[idx].effects = effects;
}

EMSCRIPTEN_KEEPALIVE void ig_assign_effect(struct effect* effects, ig_int idx, ig_int min, ig_int max, ig_int aff, ig_int par) {
  effects[idx].min = min;
  effects[idx].max = max;
  effects[idx].aff = aff;
  effects[idx].par = par;
}

EMSCRIPTEN_KEEPALIVE void ig_assign_int(ig_int* ints, ig_int idx, ig_int val) {
  ints[idx] = val;
}

EMSCRIPTEN_KEEPALIVE ig_int ig_get_int(ig_int* ints, ig_int idx) {
  return ints[idx];
}

EMSCRIPTEN_KEEPALIVE void ig_prefer_sequential() {
  ig_which = ig_which_sequential;
}

EMSCRIPTEN_KEEPALIVE void ig_prefer_binary() {
  ig_which = ig_which_binary;
}

EMSCRIPTEN_KEEPALIVE struct effect* ig_get_effect(struct effect* effect, ig_int idx) {
  return &effect[idx];
}

EMSCRIPTEN_KEEPALIVE ig_int ig_get_effect_max(struct effect* effect) {
  return effect->max;
}

EMSCRIPTEN_KEEPALIVE ig_int ig_test_100_one_per_group_rand() {
  const ig_int K = 100;
  struct group* groups = (struct group*)malloc(sizeof(struct group) * K);
  struct effect* effects = (struct effect*)malloc(sizeof(struct effect) * K);
  if (!groups) {
    free(effects);
    return -1;
  }
  if (!effects) {
    free(groups);
    return -1;
  }
  memset(groups, 0, sizeof(struct group) * K);
  memset(effects, 0, sizeof(struct effect) * K);
  struct effect* root = effects;
  for (ig_int i = 0; i < K / 2; ++i) {
    groups[i].weight = 1 + (i > 0 ? groups[i - 1].weight : 0);
    groups[i].offset = i + K / 2;
    groups[i].length = 1;
    groups[i + K / 2].length = 1;
    groups[i + K / 2].weight = 1;
    groups[i + K / 2].effects = root;
    root->min = 1;
    root->aff = 10 + i % 2;
    root += 1;
  }
  struct effect summary[2];
  memset(summary, 0, sizeof(summary));
  summary[0].min = 1;
  summary[0].aff = 10;
  summary[1].min = 1;
  summary[1].aff = 11;
  ig_int counts = 3;
  ig_int lengths = K / 2;
  ig_int length1 = 1;
  ig_int length2 = 2;
  ig_int seed[4] = { 0, 1, 2, 3 };
  ig_int N = 1000000;
  ig_int res = ig_generate(N, &counts, &groups, &lengths, length1, summary, length2, seed, NULL, 0, NULL, 0);
  free(groups);
  free(effects);
  return res != 765234;
}

EMSCRIPTEN_KEEPALIVE ig_int ig_test_100_one_per_group_all() {
  const ig_int K = 100;
  struct group* groups = (struct group*)malloc(sizeof(struct group) * K);
  struct effect* effects = (struct effect*)malloc(sizeof(struct effect) * K);
  if (!groups) {
    free(effects);
    return -1;
  }
  if (!effects) {
    free(groups);
    return -1;
  }
  memset(groups, 0, sizeof(struct group) * K);
  memset(effects, 0, sizeof(struct effect) * K);
  struct effect* root = effects;
  for (int32_t i = 0; i < K / 2; ++i) {
    groups[i].weight = 1 + (i > 0 ? groups[i - 1].weight : 0);
    groups[i].offset = i +  K / 2;
    groups[i].length = 1;
    groups[i + K / 2].length = 1;
    groups[i + K / 2].weight = 1;
    groups[i + K / 2].effects = root;
    root->min = 1;
    root->aff = 10;
    root += 1;
  }
  struct effect summary[1];
  memset(summary, 0, sizeof(summary));
  summary[0].min = 1;
  summary[0].aff = 10;
  ig_int counts = 3;
  ig_int lengths = K / 2;
  ig_int length1 = 1;
  ig_int length2 = 1;
  ig_int seed[4] = { 0, 1, 2, 3 };
  ig_int N = 1000000;
  ig_int res = ig_generate(N, &counts, &groups, &lengths, length1, summary, length2, seed, NULL, 0, NULL, 0);
  free(groups);
  free(effects);
  return res != N;
}

EMSCRIPTEN_KEEPALIVE ig_int ig_test_150_one_per_group_two_all() {
  const ig_int K = 100;
  struct group* groups = (struct group*)malloc(sizeof(struct group) * K);
  struct effect* effects = (struct effect*)malloc(sizeof(struct effect) * K);
  if (!groups) {
    free(effects);
    return -1;
  }
  if (!effects) {
    free(groups);
    return -1;
  }
  memset(groups, 0, sizeof(struct group) * K);
  memset(effects, 0, sizeof(struct effect) * K);
  struct effect* root = effects;
  for (int32_t i = 0; i < K / 2; ++i) {
    groups[i].weight = 1 + (i > 0 ? groups[i - 1].weight : 0);
    groups[i].offset = i + K / 2;
    groups[i].length = 1;
    groups[i + K / 2].length = 2;
    groups[i + K / 2].weight = 1;
    groups[i + K / 2].effects = root;
    for (int32_t j = 0; j < 2; ++j, ++root) {
      root->min = 1;
      root->aff = 10 + j;
    }
  }
  struct effect summary[2];
  memset(summary, 0, sizeof(summary));
  summary[0].min = 1;
  summary[0].aff = 10;
  summary[0].min = 1;
  summary[0].aff = 11;
  ig_int counts = 3;
  ig_int lengths = K / 3;
  ig_int length1 = 1;
  ig_int length2 = 2;
  ig_int seed[4] = { 0, 1, 2, 3 };
  ig_int N = 1000000;
  ig_int res = ig_generate(N, &counts, &groups, &lengths, length1, summary, length2, seed, NULL, 0, NULL, 0);
  free(groups);
  free(effects);
  return res != N;
}

EMSCRIPTEN_KEEPALIVE ig_int ig_test_150_two_per_group() {
  const ig_int K = 150;
  struct group* groups = (struct group*)malloc(sizeof(struct group) * K);
  struct effect* effects = (struct effect*)malloc(sizeof(struct effect) * K);
  if (!groups) {
    free(effects);
    return -1;
  }
  if (!effects) {
    free(groups);
    return -1;
  }
  memset(groups, 0, sizeof(struct group) * K);
  memset(effects, 0, sizeof(struct effect) * K);
  struct effect* root = effects;
  for (int32_t i = 0; i < K / 3; ++i) {
    groups[i].weight = 2 + (i > 0 ? groups[i - 1].weight : 0);
    groups[i].offset = i * 2 +  K / 3;
    groups[i].length = 2;
    for (int32_t j = 0; j < 2; ++j, ++root) {
      groups[i * 2 + K / 3 + j].length = 1;
      groups[i * 2 + K / 3 + j].weight = 1 + j;
      groups[i * 2 + K / 3 + j].effects = root;
      root->min = 1;
      root->aff = 10 + j;
    }
  }
  struct effect summary[2];
  memset(summary, 0, sizeof(summary));
  summary[0].min = 1;
  summary[0].aff = 10;
  summary[0].min = 1;
  summary[0].aff = 11;
  ig_int counts = 3;
  ig_int lengths = K / 3;
  ig_int length1 = 1;
  ig_int length2 = 2;
  ig_int seed[4] = { 0, 1, 2, 3 };
  ig_int N = 1000000;
  ig_int res = ig_generate(N, &counts, &groups, &lengths, length1, summary, length2, seed, NULL, 0, NULL, 0);
  free(groups);
  free(effects);
  return res != 875240;
}

EMSCRIPTEN_KEEPALIVE ig_int ig_test_150_extras() {
  const ig_int K = 150;
  struct group* groups = (struct group*)malloc(sizeof(struct group) * K);
  struct effect* effects = (struct effect*)malloc(sizeof(struct effect) * K);
  struct effect* extras = (struct effect*)malloc(sizeof(struct effect) * 2);
  if (!groups) {
    free(effects);
    free(extras);
    return -1;
  }
  if (!effects) {
    free(groups);
    free(extras);
    return -1;
  }
  if (!extras) {
    free(effects);
    free(groups);
    return -1;
  }
  memset(groups, 0, sizeof(struct group) * K);
  memset(effects, 0, sizeof(struct effect) * K);
  memset(extras, 0, sizeof(struct effect) * 2);
  struct effect* root = effects;
  for (int32_t i = 0; i < K / 3; ++i) {
    groups[i].weight = 2 + (i > 0 ? groups[i - 1].weight : 0);
    groups[i].offset = i * 2 +  K / 3;
    groups[i].length = 2;
    for (int32_t j = 0; j < 2; ++j, ++root) {
      groups[i * 2 + K / 3 + j].length = 1;
      groups[i * 2 + K / 3 + j].weight = 1 + j;
      groups[i * 2 + K / 3 + j].effects = root;
      root->min = 1;
      root->aff = 10 + j;
    }
  }
  struct effect summary[2];
  memset(summary, 0, sizeof(summary));
  summary[0].min = 1;
  summary[0].aff = 10;
  summary[0].min = 1;
  summary[0].aff = 11;
  // mirror summary
  extras[0].min = 1;
  extras[0].aff = 10;
  extras[1].min = 1;
  extras[1].aff = 11;
  ig_int counts = 3;
  ig_int lengths = K / 3;
  ig_int length1 = 1;
  ig_int length2 = 2;
  ig_int seed[4] = { 0, 1, 2, 3 };
  ig_int N = 1000000;
  ig_int res = ig_generate(N, &counts, &groups, &lengths, length1, summary, length2, seed, extras, 2, NULL, 0);
  free(groups);
  free(effects);
  free(extras);
  return res != N;
}

EMSCRIPTEN_KEEPALIVE ig_int ig_bench(ig_int n) {
  const ig_int K = 1000;
  struct group* groups = (struct group*)malloc(sizeof(struct group) * K);
  struct effect* effects = (struct effect*)malloc(sizeof(struct effect) * K);
  if (!groups) {
    free(effects);
    return -1;
  }
  if (!effects) {
    free(groups);
    return -1;
  }
  memset(groups, 0, sizeof(struct group) * K);
  memset(effects, 0, sizeof(struct effect) * K);
  struct effect* root = effects;
  for (int32_t i = 0; i < K / 2; ++i, ++root) {
    groups[i].weight = 1 + (i > 0 ? groups[i - 1].weight : 0);
    groups[i].offset = i +  K / 2;
    groups[i].length = 1;
    groups[i + K / 2].length = 1;
    groups[i + K / 2].weight = 1;
    root->min = 1;
    root->aff = 10;
  }
  struct effect summary[1];
  memset(summary, 0, sizeof(summary));
  summary[0].min = 1;
  summary[0].aff = 10;
  ig_int counts = 3;
  ig_int lengths = K / 2;
  ig_int length1 = 1;
  ig_int length2 = 1;
  ig_int seed[4] = { 0, 1, 2, 3 };
  ig_int res = ig_generate(n, &counts, &groups, &lengths, length1, summary, length2, seed, NULL, 0, NULL, 0);
  free(groups);
  free(effects);
  return res;
}

int main() {
  return 0;
}
