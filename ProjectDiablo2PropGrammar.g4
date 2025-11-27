grammar ProjectDiablo2PropGrammar;
// strength 1 1 ModStr1a ModStr1a 
strength: percentage 'to' 'strength';
// dgrp1 1 1 Moditem2allattrib Moditem2allattrib 
dgrp1: percentage 'to' 'all' 'attributes';
// energy 1 1 ModStr1d ModStr1d 
energy: percentage 'to' 'energy';
// dexterity 1 1 ModStr1b ModStr1b 
dexterity: percentage 'to' 'dexterity';
// vitality 1 1 ModStr1c ModStr1c 
vitality: percentage 'to' 'vitality';
// maxhp 1 1 ModStr1u ModStr1u 
maxhp: percentage 'to' 'life';
// maxmana 1 1 ModStr1e ModStr1e 
maxmana: percentage 'to' 'mana';
// maxstamina 1 1 ModStr5d ModStr5d 
maxstamina: percentage 'maximum' 'stamina';
// item_armor_percent 4 1 Modstr2v Modstr2v 
item_armor_percent: percentage 'enhanced' 'defense';
// item_maxdamage_percent 3 0 ModStr2j ModStr2j 
item_maxdamage_percent: 'enhanced' 'maximum' 'damage';
// item_mindamage_percent 3 0 ModStr2k ModStr2k 
item_mindamage_percent: 'enhanced' 'minimum' 'damage';
// tohit 1 1 ModStr1h ModStr1h 
tohit: percentage 'to' 'attack' 'rating';
// toblock 2 1 ModStr3g ModStr3g 
toblock: percentage 'increased' 'chance' 'of' 'blocking';
// mindamage 1 1 ModStr1g ModStr1g 
mindamage: percentage 'to' 'minimum' 'damage';
// maxdamage 1 1 ModStr1f ModStr1f 
maxdamage: percentage 'to' 'maximum' 'damage';
// secondary_mindamage 1 1 ModStr1g ModStr1g 
secondary_mindamage: percentage 'to' 'minimum' 'damage';
// secondary_maxdamage 1 1 ModStr1f ModStr1f 
secondary_maxdamage: percentage 'to' 'maximum' 'damage';
// manarecoverybonus 2 2 ModStr4g ModStr4g 
manarecoverybonus: 'regenerate' 'mana' percentage;
// staminarecoverybonus 2 2 ModStr3v ModStr3v 
staminarecoverybonus: 'heal' 'stamina' 'plus' percentage;
// armorclass 1 1 ModStr1i ModStr1i 
armorclass: percentage 'defense';
// armorclass_vs_missile 1 1 ModStr6a ModStr6a 
armorclass_vs_missile: percentage 'defense' 'vs.' 'missile';
// armorclass_vs_hth 1 1 ModStr6b ModStr6b 
armorclass_vs_hth: percentage 'defense' 'vs.' 'melee';
// normal_damage_reduction 3 2 ModStr2u_PD2 ModStr2u_PD2 
normal_damage_reduction: 'physical' 'damage' 'taken' 'reduced' 'by' percentage;
// magic_damage_reduction 3 2 ModStr2t_PD2 ModStr2t_PD2 
magic_damage_reduction: 'magic' 'damage' 'taken' 'reduced' 'by' percentage;
// damageresist 2 2 ModStr2u_PD2 ModStr2u_PD2 
damageresist: 'physical' 'damage' 'taken' 'reduced' 'by' percentage;
// magicresist 4 2 ModStr1m ModStr1m 
magicresist: 'magic' 'resist' percentage;
// maxmagicresist 4 1 ModStr5x ModStr5x 
maxmagicresist: percentage 'to' 'maximum' 'magic' 'resist';
// fireresist 4 2 ModStr1j ModStr1j 
fireresist: 'fire' 'resist' percentage;
// dgrp2 19  strModAllResistances strModAllResistancesNeg 
dgrp2: 'all' 'resistances' percentage;
// maxfireresist 4 1 ModStr5u ModStr5u 
maxfireresist: percentage 'to' 'maximum' 'fire' 'resist';
// lightresist 4 2 ModStr1l ModStr1l 
lightresist: 'lightning' 'resist' percentage;
// maxlightresist 4 1 ModStr5w ModStr5w 
maxlightresist: percentage 'to' 'maximum' 'lightning' 'resist';
// coldresist 4 2 ModStr1k ModStr1k 
coldresist: 'cold' 'resist' percentage;
// maxcoldresist 4 1 ModStr5v ModStr5v 
maxcoldresist: percentage 'to' 'maximum' 'cold' 'resist';
// poisonresist 4 2 ModStr1n ModStr1n 
poisonresist: 'poison' 'resist' percentage;
// maxpoisonresist 4 1 ModStr5y ModStr5y 
maxpoisonresist: percentage 'to' 'maximum' 'poison' 'resist';
// firemindam 1 1 ModStr1p ModStr1p 
firemindam: percentage 'to' 'minimum' 'fire' 'damage';
// firemaxdam 1 1 ModStr1o ModStr1o 
firemaxdam: percentage 'to' 'maximum' 'fire' 'damage';
// lightmindam 1 1 ModStr1r ModStr1r 
lightmindam: percentage 'to' 'minimum' 'lightning' 'damage';
// lightmaxdam 1 1 ModStr1q ModStr1q 
lightmaxdam: percentage 'to' 'maximum' 'lightning' 'damage';
// magicmindam 1 1 strModMagicDamage strModMagicDamage 
magicmindam: percentage '+%d' 'magic' 'damage';
// magicmaxdam 1 1 strModMagicDamage strModMagicDamage 
magicmaxdam: percentage '+%d' 'magic' 'damage';
// coldmindam 1 1 ModStr1t ModStr1t 
coldmindam: percentage 'to' 'minimum' 'cold' 'damage';
// coldmaxdam 1 1 ModStr1s ModStr1s 
coldmaxdam: percentage 'to' 'maximum' 'cold' 'damage';
// poisonmindam 1 1 ModStr4i ModStr4i 
poisonmindam: percentage 'to' 'minimum' 'poison' 'damage';
// poisonmaxdam 1 1 ModStr4h ModStr4h 
poisonmaxdam: percentage 'to' 'maximum' 'poison' 'damage';
// lifedrainmindam 2 1 ModStr2z ModStr2z 
lifedrainmindam: percentage 'life' 'stolen' 'per' 'hit';
// manadrainmindam 2 1 ModStr2y ModStr2y 
manadrainmindam: percentage 'mana' 'stolen' 'per' 'hit';
// hpregen 1 2 ModStr2l ModStr2w 
hpregen: ('replenish' 'life'|'drain' 'life') percentage;
// item_maxdurability_percent 2 2 ModStr2i ModStr2i 
item_maxdurability_percent: 'increase' 'maximum' 'durability' percentage;
// item_maxhp_percent 2 2 ModStr2g ModStr2g 
item_maxhp_percent: 'increase' 'maximum' 'life' percentage;
// item_maxmana_percent 2 2 ModStr2h ModStr2h 
item_maxmana_percent: 'increase' 'maximum' 'mana' percentage;
// item_attackertakesdamage 3 2 ModStr1v ModStr1v 
item_attackertakesdamage: 'attacker' 'takes' 'damage' 'of' percentage;
// item_goldbonus 2 1 ModStr1w ModStr1w 
item_goldbonus: percentage 'extra' 'gold' 'from' 'monsters';
// item_magicbonus 2 1 ModStr1x ModStr1x 
item_magicbonus: percentage 'better' 'chance' 'of' 'getting' 'magic' 'items';
// item_knockback 3 0 ModStr1y ModStr1y 
item_knockback: 'knockback';
// item_addclassskills 13 1 ModStr3a ModStr3a 
item_addclassskills: percentage ('to' class 'skill' 'levels');
// item_addexperience 4 1 Moditem2ExpG Moditem2ExpG 
item_addexperience: percentage 'to' 'experience' 'gained';
// item_healafterkill 1 1 ModitemHPaK ModitemHPaK 
item_healafterkill: percentage 'life' 'after' 'each' 'kill';
// item_reducedprices 2 2 ModitemRedVendP ModitemRedVendP 
item_reducedprices: 'reduces' 'all' 'vendor' 'prices' percentage;
// item_lightradius 1 1 ModStr3f ModStr3f 
item_lightradius: percentage 'to' 'light' 'radius';
// item_req_percent 4 2 ModStr3h ModStr3h 
item_req_percent: 'requirements' percentage;
// item_fasterattackrate 4 1 ModStr4m ModStr4m 
item_fasterattackrate: percentage 'increased' 'attack' 'speed';
// item_fastermovevelocity 4 1 ModStr4s ModStr4s 
item_fastermovevelocity: percentage 'faster' 'run/walk';
// item_nonclassskill 28    
item_nonclassskill: percentage 'to' any_skill;
// item_fastergethitrate 4 1 ModStr4p ModStr4p 
item_fastergethitrate: percentage 'faster' 'hit' 'recovery';
// item_fasterblockrate 4 1 ModStr4y ModStr4y 
item_fasterblockrate: percentage 'faster' 'block' 'rate';
// item_fastercastrate 4 1 ModStr4v ModStr4v 
item_fastercastrate: percentage 'faster' 'cast' 'rate';
// item_singleskill 27    
item_singleskill: percentage 'to' class_only_skill;
// item_restinpeace 3 0 ModitemSMRIP ModitemSMRIP 
item_restinpeace: 'slain' 'monsters' 'rest' 'in' 'peace';
// curse_resistance 2 1 ModReduceCurseDuration ModReduceCurseDuration 
curse_resistance: percentage 'reduced' 'curse' 'duration';
// item_poisonlengthresist 2 2 ModStr3r ModStr3r 
item_poisonlengthresist: 'poison' 'length' 'reduced' 'by' percentage;
// item_normaldamage 1 2 ModStr5b ModStr5b 
item_normaldamage: 'damage' percentage;
// item_howl 5 2 ModStr3u ModStr3u 
item_howl: 'hit' 'causes' 'monster' 'to' 'flee' percentage;
// item_stupidity 12 2 ModStr6d ModStr6d 
item_stupidity: 'hit' 'blinds' 'target' percentage;
// item_damagetomana 2 1 ModStr3w_PD2 ModStr3w_PD2 
item_damagetomana: percentage 'damage' 'taken' 'gained' 'as' 'mana' 'when' 'hit';
// item_ignoretargetac 3 0 ModStr3y ModStr3y 
item_ignoretargetac: 'ignore' 'target\'s' 'defense';
// item_fractionaltargetac 20 1 ModStr5o ModStr5o 
item_fractionaltargetac: percentage 'target' 'defense';
// item_preventheal 3 0 ModStr4a ModStr4a 
item_preventheal: 'prevent' 'monster' 'heal';
// item_halffreezeduration 3 0 ModStr4b ModStr4b 
item_halffreezeduration: 'half' 'freeze' 'duration';
// item_tohit_percent 2 1 ModStr4c ModStr4c 
item_tohit_percent: percentage 'bonus' 'to' 'attack' 'rating';
// item_damagetargetac 1 1 ModStr4d ModStr4d 
item_damagetargetac: percentage 'to' 'monster' 'defense' 'per' 'hit';
// item_demondamage_percent 4 1 ModStr4e ModStr4e 
item_demondamage_percent: percentage 'damage' 'to' 'demons';
// item_undeaddamage_percent 4 1 ModStr4f ModStr4f 
item_undeaddamage_percent: percentage 'damage' 'to' 'undead';
// item_demon_tohit 1 1 ModStr4j ModStr4j 
item_demon_tohit: percentage 'to' 'attack' 'rating' 'against' 'demons';
// item_undead_tohit 1 1 ModStr4k ModStr4k 
item_undead_tohit: percentage 'to' 'attack' 'rating' 'against' 'undead';
// item_throwable 3 0 ModStr5a ModStr5a 
item_throwable: 'throwable';
// item_allskills 1 1 ModStr3k ModStr3k 
item_allskills: percentage 'to' 'all' 'skills';
// item_attackertakeslightdamage 3 2 ModStr3j ModStr3j 
item_attackertakeslightdamage: 'attacker' 'takes' 'lightning' 'damage' 'of' percentage;
// item_freeze 12 2 ModStr3l ModStr3l 
item_freeze: 'freezes' 'target' percentage;
// item_openwounds 2 1 ModStr3m ModStr3m 
item_openwounds: percentage 'chance' 'of' 'open' 'wounds';
// item_crushingblow 4 1 ModStr5c ModStr5c 
item_crushingblow: percentage 'chance' 'of' 'crushing' 'blow';
// item_kickdamage 1 1 ModStr5e ModStr5e 
item_kickdamage: percentage 'kick' 'damage';
// item_manaafterkill 1 1 ModStr5f ModStr5f 
item_manaafterkill: percentage 'to' 'mana' 'after' 'each' 'kill';
// item_healafterdemonkill 1 1 ModStr6c ModStr6c 
item_healafterdemonkill: percentage 'life' 'after' 'each' 'demon' 'kill';
// item_deadlystrike 2 1 ModStr5q ModStr5q 
item_deadlystrike: percentage 'deadly' 'strike';
// item_absorbfire_percent 2 2 ModStr5g ModStr5g 
item_absorbfire_percent: 'fire' 'absorb' percentage;
// item_absorbfire 1 1 ModStr5h ModStr5h 
item_absorbfire: percentage 'fire' 'absorb';
// item_absorblight_percent 2 2 ModStr5i ModStr5i 
item_absorblight_percent: 'lightning' 'absorb' percentage;
// item_absorblight 1 1 ModStr5j ModStr5j 
item_absorblight: percentage 'lightning' 'absorb';
// item_absorbmagic_percent 2 2 ModStr5k ModStr5k 
item_absorbmagic_percent: 'magic' 'absorb' percentage;
// item_absorbmagic 1 1 ModStr5l ModStr5l 
item_absorbmagic: percentage 'magic' 'absorb';
// item_absorbcold_percent 2 2 ModStr5m ModStr5m 
item_absorbcold_percent: 'cold' 'absorb' percentage;
// item_absorbcold 1 1 ModStr5n ModStr5n 
item_absorbcold: percentage 'cold' 'absorb';
// item_slow 2 2 ModStr5r ModStr5r 
item_slow: 'slows' 'target' 'by' percentage;
// item_aura 16 0 ModitemAura ModitemAura 
item_aura: 'level' percentage  any_skill 'aura' 'when' 'equipped';
// item_indesctructible 3 0 ModStre9s ModStre9s 
item_indesctructible: 'indestructible';
// item_cannotbefrozen 3 0 ModStr5z ModStr5z 
item_cannotbefrozen: 'cannot' 'be' 'frozen';
// item_staminadrainpct 2 1 ModStr6e ModStr6e 
item_staminadrainpct: percentage 'slower' 'stamina' 'drain';
// item_reanimate 23 1 Moditemreanimas Moditemreanimas 
item_reanimate: percentage 'reanimate' 'as:' .*?;
// item_pierce 4 1 ModPierceChance ModPierceChance 
item_pierce: percentage 'chance' 'to' 'pierce';
// item_magicarrow 3 0 ModStr6h ModStr6h 
item_magicarrow: 'fires' 'magic' 'arrows';
// item_explosivearrow 3 0 ModStr6i ModStr6i 
item_explosivearrow: 'fires' 'explosive' 'arrows' 'or' 'bolts';
// attack_vs_montype 22 1 ModitemAttratvsM ModitemAttratvsM 
attack_vs_montype: percentage 'to' 'attack' 'rating' 'versus';
// damage_vs_montype 22 1 Moditemdamvsm Moditemdamvsm 
damage_vs_montype: percentage 'to' 'damage' 'versus';
// uber_difficulty 3 2 MapTier MapTier 
uber_difficulty: 'tier:' percentage;
// map_glob_boss_dropskillers 3 0 MapBossSkillers MapBossSkillers 
map_glob_boss_dropskillers: 'map' 'boss' 'drops' 'a' 'skill' 'charm';
// map_glob_boss_dropcorruptedunique 3 0 MapBossCorruptedUnique MapBossCorruptedUnique 
map_glob_boss_dropcorruptedunique: 'map' 'boss' 'drops' 'a' 'corrupted' 'unique';
// item_addskill_tab 14  StrSklTabItem1 StrSklTabItem1 
item_addskill_tab: (percentage 'to' 'bow' 'and' 'crossbow' 'skills' '(' class 'only' ')' | percentage 'to' 'passive' 'and' 'magic' 'skills' '(' class 'only' ')' | percentage 'to' 'javelin' 'and' 'spear' 'skills' '(' class 'only' ')' | percentage 'to' 'fire' 'skills' '(' class 'only' ')' | percentage 'to' 'lightning' 'skills' '(' class 'only' ')' | percentage 'to' 'cold' 'skills' '(' class 'only' ')' | percentage 'to' 'curses' 'skills'? '(' class 'only' ')' | percentage 'to' 'poison' 'and' 'bone' 'skills' '(' class 'only' ')' | percentage 'to' 'summoning' 'skills' '(' class 'only' ')' | percentage 'to' 'combat' 'skills' '(' class 'only' ')' | percentage 'to' 'offensive' 'auras' 'skills'? '(' class 'only' ')' | percentage 'to' 'defensive' 'auras' 'skills'? '(' class 'only' ')' | percentage 'to' 'combat' 'skills' '(' class 'only' ')' | percentage 'to' 'masteries' 'skills'? '(' class 'only' ')' | percentage 'to' 'warcries' 'skills'? '(' class 'only' ')' | percentage 'to' 'summoning' 'skills' '(' class 'only' ')' | percentage 'to' 'shape' 'shifting' 'skills' '(' class 'only' ')' | percentage 'to' 'elemental' 'skills' '(' class 'only' ')' | percentage 'to' 'traps' 'skills'? '(' class 'only' ')' | percentage 'to' 'shadow' 'disciplines' 'skills'? '(' class 'only' ')' | percentage 'to' 'martial' 'arts' 'skills'? '(' class 'only' ')');
// item_skillonequip 16 0 ModitemSkillOnEquip ModitemSkillOnEquip 
item_skillonequip: 'level' percentage  any_skill 'when' 'equipped';
// extra_shadow 9 2 YouMaySummon YouMaySummon ExtraShadow
extra_shadow: 'you' 'may' 'summon' percentage 'additional' 'shadow';
// extra_spiritwolf 9 2 YouMaySummon YouMaySummon ExtraSpiritWolf
extra_spiritwolf: 'you' 'may' 'summon' percentage 'additional' 'spirit' 'wolves';
// item_skillonattack 15  ItemExpansiveChancX ItemExpansiveChancX 
item_skillonattack: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'on' 'attack';
// item_skillonkill 15  ModitemskonKill ModitemskonKill 
item_skillonkill: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'when' 'you' 'kill' 'an' 'enemy';
// item_skillondeath 15  Moditemskondeath Moditemskondeath 
item_skillondeath: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'when' 'you' 'die';
// item_skillonhit 15  ItemExpansiveChanc1 ItemExpansiveChanc1 
item_skillonhit: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'on' 'striking';
// item_skillonlevelup 15  ModitemskonLevel ModitemskonLevel 
item_skillonlevelup: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'when' 'you' 'level-up';
// item_skilloncast 15  ModItemSkOnCast ModItemSkOnCast 
item_skilloncast: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'on' 'casting';
// item_skillongethit 15  ItemExpansiveChanc2 ItemExpansiveChanc2 
item_skillongethit: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'when' 'struck';
// item_skillonblock 15  ModItemSkOnBlock ModItemSkOnBlock 
item_skillonblock: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'on' 'block';
// item_skilloncrit 15  ModItemSkOnCrit ModItemSkOnCrit 
item_skilloncrit: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'on' 'critical' 'hit';
// item_charged_skill 24  ModStre10d ModStre10d 
item_charged_skill: 'level' percentage any_skill '(' percentage '/' percentage 'charges' ')';
// item_skillonpierce 15  ModItemSkOnPierce ModItemSkOnPierce 
item_skillonpierce: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'on' 'pierce';
// desecrated 3 0 StrDesecrated StrDesecrated 
desecrated: 'desecrated';
// joustreduction_zeraes 3 0 JoustreductionZeraes JoustreductionZeraes 
joustreduction_zeraes: 'joust' 'cooldown' 'reduced' 'by' '1.5' 'seconds';
// item_maxdeadlystrike 4 2 StrMaxDeadlyStrike StrMaxDeadlyStrike 
item_maxdeadlystrike: 'maximum' 'deadly' 'strike' percentage;
// map_glob_boss_dropubermats 3 0 MapBossUberMats MapBossUberMats 
map_glob_boss_dropubermats: 'map' 'bosses' 'drop' 'an' 'uber' 'material';
// map_glob_boss_droppuzzlebox 3 0 MapBossPuzzlebox MapBossPuzzlebox 
map_glob_boss_droppuzzlebox: 'map' 'boss' 'drops' 'a' 'larzuk\'s' 'puzzlebox';
// item_mindamage_energy 6 1 ModStr1g ModStr1g increaseswithenergy
item_mindamage_energy: percentage 'to' 'minimum' 'damage' '(' 'based' 'on' 'energy' ')';
// item_armor_perlevel 6 1 ModStr1i ModStr1i increaseswithplaylevelX
item_armor_perlevel: percentage 'defense' '(' 'based' 'on' 'character' 'level' ')';
// item_armorpercent_perlevel 8 1 Modstr2v Modstr2v increaseswithplaylevelX
item_armorpercent_perlevel: percentage 'enhanced' 'defense' '(' 'based' 'on' 'character' 'level' ')';
// item_hp_perlevel 6 1 ModStr1u ModStr1u increaseswithplaylevelX
item_hp_perlevel: percentage 'to' 'life' '(' 'based' 'on' 'character' 'level' ')';
// item_mana_perlevel 6 1 ModStr1e ModStr1e increaseswithplaylevelX
item_mana_perlevel: percentage 'to' 'mana' '(' 'based' 'on' 'character' 'level' ')';
// item_maxdamage_perlevel 6 1 ModStr1f ModStr1f increaseswithplaylevelX
item_maxdamage_perlevel: percentage 'to' 'maximum' 'damage' '(' 'based' 'on' 'character' 'level' ')';
// item_maxdamage_percent_perlevel 8 1 ModStr2j ModStr2j increaseswithplaylevelX
item_maxdamage_percent_perlevel: percentage 'enhanced' 'maximum' 'damage' '(' 'based' 'on' 'character' 'level' ')';
// item_strength_perlevel 6 1 ModStr1a ModStr1a increaseswithplaylevelX
item_strength_perlevel: percentage 'to' 'strength' '(' 'based' 'on' 'character' 'level' ')';
// item_dexterity_perlevel 6 1 ModStr1b ModStr1b increaseswithplaylevelX
item_dexterity_perlevel: percentage 'to' 'dexterity' '(' 'based' 'on' 'character' 'level' ')';
// item_energy_perlevel 6 1 ModStr1d ModStr1d increaseswithplaylevelX
item_energy_perlevel: percentage 'to' 'energy' '(' 'based' 'on' 'character' 'level' ')';
// item_vitality_perlevel 6 1 ModStr1c ModStr1c increaseswithplaylevelX
item_vitality_perlevel: percentage 'to' 'vitality' '(' 'based' 'on' 'character' 'level' ')';
// item_tohit_perlevel 6 1 ModStr1h ModStr1h increaseswithplaylevelX
item_tohit_perlevel: percentage 'to' 'attack' 'rating' '(' 'based' 'on' 'character' 'level' ')';
// item_tohitpercent_perlevel 7 1 ModStr4c ModStr4c increaseswithplaylevelX
item_tohitpercent_perlevel: percentage 'bonus' 'to' 'attack' 'rating' '(' 'based' 'on' 'character' 'level' ')';
// item_cold_damagemax_perlevel 6 1 ModStr1s ModStr1s increaseswithplaylevelX
item_cold_damagemax_perlevel: percentage 'to' 'maximum' 'cold' 'damage' '(' 'based' 'on' 'character' 'level' ')';
// item_fire_damagemax_perlevel 6 1 ModStr1o ModStr1o increaseswithplaylevelX
item_fire_damagemax_perlevel: percentage 'to' 'maximum' 'fire' 'damage' '(' 'based' 'on' 'character' 'level' ')';
// item_ltng_damagemax_perlevel 6 1 ModStr1q ModStr1q increaseswithplaylevelX
item_ltng_damagemax_perlevel: percentage 'to' 'maximum' 'lightning' 'damage' '(' 'based' 'on' 'character' 'level' ')';
// item_pois_damagemax_perlevel 6 1 ModStr4h ModStr4h increaseswithplaylevelX
item_pois_damagemax_perlevel: percentage 'to' 'maximum' 'poison' 'damage' '(' 'based' 'on' 'character' 'level' ')';
// item_resist_cold_perlevel 7 2 ModStr1k ModStr1k increaseswithplaylevelX
item_resist_cold_perlevel: 'cold' 'resist' percentage '(' 'based' 'on' 'character' 'level' ')';
// item_resist_fire_perlevel 7 2 ModStr1j ModStr1j increaseswithplaylevelX
item_resist_fire_perlevel: 'fire' 'resist' percentage '(' 'based' 'on' 'character' 'level' ')';
// item_resist_ltng_perlevel 7 2 ModStr1l ModStr1l increaseswithplaylevelX
item_resist_ltng_perlevel: 'lightning' 'resist' percentage '(' 'based' 'on' 'character' 'level' ')';
// item_resist_pois_perlevel 7 2 ModStr1n ModStr1n increaseswithplaylevelX
item_resist_pois_perlevel: 'poison' 'resist' percentage '(' 'based' 'on' 'character' 'level' ')';
// item_absorb_cold_perlevel 6 1 ModStre9p ModStre9p increaseswithplaylevelX
item_absorb_cold_perlevel: percentage 'absorbs' 'cold' 'damage' '(' 'based' 'on' 'character' 'level' ')';
// item_absorb_fire_perlevel 6 1 ModStre9o ModStre9o increaseswithplaylevelX
item_absorb_fire_perlevel: percentage 'absorbs' 'fire' 'damage' '(' 'based' 'on' 'character' 'level' ')';
// item_absorb_ltng_perlevel 6 1 ModStre9q ModStre9q increaseswithplaylevelX
item_absorb_ltng_perlevel: percentage 'absorbs' 'lightning' 'damage' '(' 'based' 'on' 'character' 'level' ')';
// item_thorns_perlevel 9 2 ModStr1v ModStr1v increaseswithplaylevelX
item_thorns_perlevel: 'attacker' 'takes' 'damage' 'of' percentage '(' 'based' 'on' 'character' 'level' ')';
// item_find_gold_perlevel 7 1 ModStr1w ModStr1w increaseswithplaylevelX
item_find_gold_perlevel: percentage 'extra' 'gold' 'from' 'monsters' '(' 'based' 'on' 'character' 'level' ')';
// item_find_magic_perlevel 7 1 ModStr1x ModStr1x increaseswithplaylevelX
item_find_magic_perlevel: percentage 'better' 'chance' 'of' 'getting' 'magic' 'items' '(' 'based' 'on' 'character' 'level' ')';
// item_regenstamina_perlevel 8 2 ModStr3v ModStr3v increaseswithplaylevelX
item_regenstamina_perlevel: 'heal' 'stamina' 'plus' percentage '(' 'based' 'on' 'character' 'level' ')';
// item_stamina_perlevel 6 1 ModStr5d ModStr5d increaseswithplaylevelX
item_stamina_perlevel: percentage 'maximum' 'stamina' '(' 'based' 'on' 'character' 'level' ')';
// item_damage_demon_perlevel 8 1 ModStr4e ModStr4e increaseswithplaylevelX
item_damage_demon_perlevel: percentage 'damage' 'to' 'demons' '(' 'based' 'on' 'character' 'level' ')';
// item_damage_undead_perlevel 8 1 ModStr4f ModStr4f increaseswithplaylevelX
item_damage_undead_perlevel: percentage 'damage' 'to' 'undead' '(' 'based' 'on' 'character' 'level' ')';
// item_tohit_demon_perlevel 6 1 ModStr4j ModStr4j increaseswithplaylevelX
item_tohit_demon_perlevel: percentage 'to' 'attack' 'rating' 'against' 'demons' '(' 'based' 'on' 'character' 'level' ')';
// item_tohit_undead_perlevel 6 1 ModStr4k ModStr4k increaseswithplaylevelX
item_tohit_undead_perlevel: percentage 'to' 'attack' 'rating' 'against' 'undead' '(' 'based' 'on' 'character' 'level' ')';
// item_crushingblow_perlevel 7 1 ModStr5c ModStr5c increaseswithplaylevelX
item_crushingblow_perlevel: percentage 'chance' 'of' 'crushing' 'blow' '(' 'based' 'on' 'character' 'level' ')';
// item_openwounds_perlevel 7 1 ModStr3m ModStr3m increaseswithplaylevelX
item_openwounds_perlevel: percentage 'chance' 'of' 'open' 'wounds' '(' 'based' 'on' 'character' 'level' ')';
// item_kick_damage_perlevel 6 1 ModStr5e ModStr5e increaseswithplaylevelX
item_kick_damage_perlevel: percentage 'kick' 'damage' '(' 'based' 'on' 'character' 'level' ')';
// item_deadlystrike_perlevel 7 1 ModStr5q ModStr5q increaseswithplaylevelX
item_deadlystrike_perlevel: percentage 'deadly' 'strike' '(' 'based' 'on' 'character' 'level' ')';
// item_replenish_durability 11 0 ModStre9t ModStre9t 
item_replenish_durability: 'repairs' percentage 'durability' 'per' 'second';
// item_replenish_quantity 3 0 ModStre9v ModStre9v 
item_replenish_quantity: 'replenishes' 'quantity';
// item_extra_stack 3 0 ModStre9i ModStre9i 
item_extra_stack: 'increased' 'stack' 'size';
// item_crushingblow_efficiency 4 1 CrushEfficiency CrushEfficiency 
item_crushingblow_efficiency: percentage 'crushing' 'blow' 'efficiency';
// extra_cold_arrows 9 2 ColdArrowFires ColdArrowFires AdditionalArrows
extra_cold_arrows: 'cold' 'arrow' 'fires' percentage 'additional' 'arrows';
// item_shiny_appearance 19  StrAnniversaryEdition StrAnniversaryEdition 
item_shiny_appearance: percentage 'th' 'anniversary' 'edition';
// joustreduction_leorics 3 0 joustreductionleorics joustreductionleorics 
joustreduction_leorics: 'joust' 'cooldown' 'reduced' 'by' '0.75' 'seconds';
// map_glob_dropsocketed 19 0 MapGlobDropSockets MapGlobDropSockets 
map_glob_dropsocketed: 'monsters' 'have' percentage '%%' 'chance' 'to' 'drop' 'socketed' 'itemsmap' 'boss' 'drops' 'a' 'socketed' 'unique';
// item_pierce_cold 20 1 Moditemenrescoldsk Moditemenrescoldsk 
item_pierce_cold: percentage 'to' 'enemy' 'cold' 'resistance';
// item_pierce_fire 20 1 Moditemenresfiresk Moditemenresfiresk 
item_pierce_fire: percentage 'to' 'enemy' 'fire' 'resistance';
// item_pierce_ltng 20 1 Moditemenresltngsk Moditemenresltngsk 
item_pierce_ltng: percentage 'to' 'enemy' 'lightning' 'resistance';
// item_pierce_pois 20 1 Moditemenrespoissk Moditemenrespoissk 
item_pierce_pois: percentage 'to' 'enemy' 'poison' 'resistance';
// passive_fire_mastery 4 1 ModitemdamFiresk ModitemdamFiresk 
passive_fire_mastery: percentage 'to' 'fire' 'skill' 'damage';
// passive_ltng_mastery 4 1 ModitemdamLtngsk ModitemdamLtngsk 
passive_ltng_mastery: percentage 'to' 'lightning' 'skill' 'damage';
// passive_cold_mastery 4 1 ModitemdamColdsk ModitemdamColdsk 
passive_cold_mastery: percentage 'to' 'cold' 'skill' 'damage';
// passive_pois_mastery 4 1 ModitemdamPoissk ModitemdamPoissk 
passive_pois_mastery: percentage 'to' 'poison' 'skill' 'damage';
// passive_fire_pierce 20 1 Moditemenresfiresk Moditemenresfiresk 
passive_fire_pierce: percentage 'to' 'enemy' 'fire' 'resistance';
// passive_ltng_pierce 20 1 Moditemenresltngsk Moditemenresltngsk 
passive_ltng_pierce: percentage 'to' 'enemy' 'lightning' 'resistance';
// passive_cold_pierce 20 1 Moditemenrescoldsk Moditemenrescoldsk 
passive_cold_pierce: percentage 'to' 'enemy' 'cold' 'resistance';
// passive_pois_pierce 20 1 Moditemenrespoissk Moditemenrespoissk 
passive_pois_pierce: percentage 'to' 'enemy' 'poison' 'resistance';
// passive_mag_mastery 4 1 ModitemdamMagisk ModitemdamMagisk 
passive_mag_mastery: percentage 'to' 'magic' 'skill' 'damage';
// item_splashonhit 15 0 splash3 splash3 
item_splashonhit: 'melee' 'attacks' 'deal' 'splash' 'damage';
// corrupted 3 0 StrCorrupted StrCorrupted 
corrupted: 'corrupted';
// item_elemskill_cold 1 1 ModStrColdskills ModStrColdskills 
item_elemskill_cold: percentage 'to' 'cold' 'skills';
// item_elemskill_fire 1 1 ModStrFireskills ModStrFireskills 
item_elemskill_fire: percentage 'to' 'fire' 'skills';
// item_elemskill_lightning 1 1 ModStrLightningskills ModStrLightningskills 
item_elemskill_lightning: percentage 'to' 'lightning' 'skills';
// item_elemskill_poison 1 1 ModStrPoisonskills ModStrPoisonskills 
item_elemskill_poison: percentage 'to' 'poison' 'skills';
// item_elemskill_magic 1 1 ModStrMagicskills ModStrMagicskills 
item_elemskill_magic: percentage 'to' 'magic' 'skills';
// max_curses 3 0 StrToMaxCurses StrToMaxCurses 
max_curses: 'you' 'may' 'apply' 'an' 'additional' 'curse';
// map_defense 2 1 StrCorruptNum StrCorruptNum 
map_defense: percentage 'corrupt';
// map_play_magicbonus 4 2 MapGlobMF MapGlobMF 
map_play_magicbonus: 'magic' 'find:' percentage;
// dgrp6 4 2 MapGlobMFGF MapGlobMFGF 
dgrp6: 'magic' 'and' 'gold' 'find:' percentage;
// map_play_goldbonus 4 2 MapGlobGF MapGlobGF 
map_play_goldbonus: 'gold' 'find:' percentage;
// map_glob_density 4 2 MapGlobDensity MapGlobDensity 
map_glob_density: 'monster' 'density:' percentage;
// map_play_addexperience 4 2 MapGlobExp MapGlobExp 
map_play_addexperience: 'experience:' percentage;
// map_glob_arealevel 1 1 MapGlobLevel MapGlobLevel 
map_glob_arealevel: percentage 'to' 'area' 'level';
// map_glob_monsterrarity 4 2 MapGlobMonRarity MapGlobMonRarity 
map_glob_monsterrarity: 'monster' 'rarity:' percentage;
// map_mon_firemindam 6 2 MapMonHave MapMonHave ModStr1p
map_mon_firemindam: 'monsters' 'have' percentage 'to' 'minimum' 'fire' 'damage';
// map_mon_firemaxdam 6 2 MapMonHave MapMonHave ModStr1o
map_mon_firemaxdam: 'monsters' 'have' percentage 'to' 'maximum' 'fire' 'damage';
// map_mon_lightmindam 6 2 MapMonHave MapMonHave ModStr1r
map_mon_lightmindam: 'monsters' 'have' percentage 'to' 'minimum' 'lightning' 'damage';
// map_mon_lightmaxdam 6 2 MapMonHave MapMonHave ModStr1q
map_mon_lightmaxdam: 'monsters' 'have' percentage 'to' 'maximum' 'lightning' 'damage';
// map_mon_magicmindam 6 2 MapMonHave MapMonHave strModMagicDamage
map_mon_magicmindam: 'monsters' 'have' percentage '+%d' 'magic' 'damage';
// map_mon_magicmaxdam 6 2 MapMonHave MapMonHave strModMagicDamage
map_mon_magicmaxdam: 'monsters' 'have' percentage '+%d' 'magic' 'damage';
// map_mon_coldmindam 6 2 MapMonHave MapMonHave ModStr1t
map_mon_coldmindam: 'monsters' 'have' percentage 'to' 'minimum' 'cold' 'damage';
// map_mon_coldmaxdam 6 2 MapMonHave MapMonHave ModStr1s
map_mon_coldmaxdam: 'monsters' 'have' percentage 'to' 'maximum' 'cold' 'damage';
// map_mon_poisonmindam 6 2 MapMonHave MapMonHave ModStr4i
map_mon_poisonmindam: 'monsters' 'have' percentage 'to' 'minimum' 'poison' 'damage';
// map_mon_poisonmaxdam 6 2 MapMonHave MapMonHave ModStr4h
map_mon_poisonmaxdam: 'monsters' 'have' percentage 'to' 'maximum' 'poison' 'damage';
// map_mon_passive_fire_mastery 8 2 MapMonHave MapMonHave ModitemdamFiresk
map_mon_passive_fire_mastery: 'monsters' 'have' percentage 'to' 'fire' 'skill' 'damage';
// map_mon_passive_ltng_mastery 8 2 MapMonHave MapMonHave ModitemdamLtngsk
map_mon_passive_ltng_mastery: 'monsters' 'have' percentage 'to' 'lightning' 'skill' 'damage';
// map_mon_passive_cold_mastery 8 2 MapMonHave MapMonHave ModitemdamColdsk
map_mon_passive_cold_mastery: 'monsters' 'have' percentage 'to' 'cold' 'skill' 'damage';
// map_mon_passive_pois_mastery 8 2 MapMonHave MapMonHave ModitemdamPoissk
map_mon_passive_pois_mastery: 'monsters' 'have' percentage 'to' 'poison' 'skill' 'damage';
// map_mon_fasterattackrate 8 2 MapMonHave MapMonHave ModStr4m
map_mon_fasterattackrate: 'monsters' 'have' percentage 'increased' 'attack' 'speed';
// dgrp4 8 2 MapMonHave MapMonHave MapAtkCastRate
dgrp4: 'monsters' 'have' percentage 'increased' 'cast' 'and' 'attack' 'speed';
// map_mon_fastercastrate 8 2 MapMonHave MapMonHave ModStr4v
map_mon_fastercastrate: 'monsters' 'have' percentage 'faster' 'cast' 'rate';
// map_mon_tohit 8 2 MapMonHave MapMonHave ModStr1h
map_mon_tohit: 'monsters' 'have' percentage 'to' 'attack' 'rating';
// dgrp5 8 2 MapMonHave MapMonHave MapPierceAR
dgrp5: 'monsters' 'have' percentage 'attack' 'rating' 'and' 'chance' 'to' 'pierce';
// map_mon_acpercentage 8 2 MapMonHave MapMonHave Modstr2v
map_mon_acpercentage: 'monsters' 'have' percentage 'enhanced' 'defense';
// map_mon_absorbcold_percent 7 2 MapMonHave MapMonHave ModStr5m
map_mon_absorbcold_percent: 'monsters' 'have' percentage 'cold' 'absorb';
// map_mon_absorbmagic_percent 7 2 MapMonHave MapMonHave ModStr5k
map_mon_absorbmagic_percent: 'monsters' 'have' percentage 'magic' 'absorb';
// map_mon_absorblight_percent 7 2 MapMonHave MapMonHave ModStr5i
map_mon_absorblight_percent: 'monsters' 'have' percentage 'lightning' 'absorb';
// map_mon_absorbfire_percent 7 2 MapMonHave MapMonHave ModStr5g
map_mon_absorbfire_percent: 'monsters' 'have' percentage 'fire' 'absorb';
// map_mon_normal_damage_reduction 9 2 MapMonTake MapMonTake MapFlatPhysRed
map_mon_normal_damage_reduction: 'monsters' 'take' percentage 'reduced' 'physical' 'damage';
// map_mon_velocitypercent 7 2 MapMonHave MapMonHave MapMonVelocity
map_mon_velocitypercent: 'monsters' 'have' percentage 'increased' 'velocity';
// map_mon_hpregen 6 2 MapMonHave MapMonHave ModStr2l
map_mon_hpregen: 'monsters' 'have' percentage 'replenish' 'life';
// map_mon_lifedrainmindam 7 2 MapMonHave MapMonHave ModStr2z
map_mon_lifedrainmindam: 'monsters' 'have' percentage 'life' 'stolen' 'per' 'hit';
// map_mon_fastergethitrate 8 2 MapMonHave MapMonHave ModStr4p
map_mon_fastergethitrate: 'monsters' 'have' percentage 'faster' 'hit' 'recovery';
// map_mon_maxhp_percent 7 2 MapMonHave MapMonHave MapMaxHP
map_mon_maxhp_percent: 'monsters' 'have' percentage 'increased' 'maximum' 'life';
// map_mon_pierce 8 2 MapMonHave MapMonHave ModPierceChance
map_mon_pierce: 'monsters' 'have' percentage 'chance' 'to' 'pierce';
// map_mon_openwounds 7 2 MapMonHave MapMonHave ModStr3m
map_mon_openwounds: 'monsters' 'have' percentage 'chance' 'of' 'open' 'wounds';
// map_mon_crushingblow 7 2 MapMonHave MapMonHave ModStr5c
map_mon_crushingblow: 'monsters' 'have' percentage 'chance' 'of' 'crushing' 'blow';
// map_mon_curse_resistance 7 2 MapMonHave MapMonHave MapMonCurse
map_mon_curse_resistance: 'monsters' 'have' percentage 'curse' 'duration' 'reduction';
// map_play_acpercentage 7 2 MapPlayHave MapPlayHave Modstr2v
map_play_acpercentage: 'players' 'have' percentage 'enhanced' 'defense';
// map_play_fastergethitrate 8 2 MapPlayHave MapPlayHave ModStr4p
map_play_fastergethitrate: 'players' 'have' percentage 'faster' 'hit' 'recovery';
// map_play_toblock 7 2 MapPlayHave MapPlayHave MapPlayBlock
map_play_toblock: 'players' 'have' percentage 'chance' 'to' 'block';
// map_play_hpregen 6 2 MapPlayHave MapPlayHave ModStr2w
map_play_hpregen: 'players' 'have' percentage 'drain' 'life';
// map_play_maxfireresist 7 2 MapPlayHave MapPlayHave ModStr5u
map_play_maxfireresist: 'players' 'have' percentage 'to' 'maximum' 'fire' 'resist';
// dgrp8 7 2 MapPlayHave MapPlayHave MapPlayMaxAllRes
dgrp8: 'players' 'have' percentage 'to' 'all' 'maximum' 'resistances';
// map_play_maxlightresist 7 2 MapPlayHave MapPlayHave ModStr5w
map_play_maxlightresist: 'players' 'have' percentage 'to' 'maximum' 'lightning' 'resist';
// map_play_maxcoldresist 7 2 MapPlayHave MapPlayHave ModStr5v
map_play_maxcoldresist: 'players' 'have' percentage 'to' 'maximum' 'cold' 'resist';
// map_play_maxpoisonresist 7 2 MapPlayHave MapPlayHave ModStr5y
map_play_maxpoisonresist: 'players' 'have' percentage 'to' 'maximum' 'poison' 'resist';
// item_replenish_charges 3 0 ModStrRepCharge1 ModStrRepCharge1 ModStrRepCharge2
item_replenish_charges: 'replenish' exact_integer 'charge' 'in' exact_integer 'seconds';
// item_leap_speed 4 1 ModLeapSpeed ModLeapSpeed 
item_leap_speed: percentage 'to' 'leap' 'and' 'leap' 'attack' 'movement' 'speed';
// item_healafterhit 1 1 ModItemHPaH ModItemHPaH 
item_healafterhit: percentage 'life' 'after' 'each' 'hit';
// passive_phys_pierce 20 1 ModPhysPierce ModPhysPierce 
passive_phys_pierce: percentage 'to' 'enemy' 'physical' 'resistance';
// map_mon_edpercentage 8 2 MapMonHave MapMonHave MapEnhancedDmg
map_mon_edpercentage: 'monsters' 'have' percentage 'enhanced' 'physical' 'damage';
// map_mon_splash 9 0 MapMon MapMon MapMonSplash
map_mon_splash: 'monster\'s' 'melee' 'attacks' 'deal' 'splash' 'damage';
// map_play_fireresist 7 2 MapPlayHave MapPlayHave ModStr1j
map_play_fireresist: 'players' 'have' percentage 'fire' 'resist';
// dgrp3 7 2 MapPlayHave MapPlayHave MapPlayAllRes
dgrp3: 'players' 'have' percentage 'to' 'all' 'resistances';
// map_play_lightresist 7 2 MapPlayHave MapPlayHave ModStr1l
map_play_lightresist: 'players' 'have' percentage 'lightning' 'resist';
// map_play_coldresist 7 2 MapPlayHave MapPlayHave ModStr1k
map_play_coldresist: 'players' 'have' percentage 'cold' 'resist';
// map_play_poisonresist 7 2 MapPlayHave MapPlayHave ModStr1n
map_play_poisonresist: 'players' 'have' percentage 'poison' 'resist';
// map_mon_phys_as_extra_ltng 8 2 MapMonHave MapMonHave MapPhysExtraLtng
map_mon_phys_as_extra_ltng: 'monsters' 'have' percentage 'of' 'physical' 'damage' 'as' 'extra' 'lightning' 'damage';
// map_mon_phys_as_extra_cold 8 2 MapMonHave MapMonHave MapPhysExtraCold
map_mon_phys_as_extra_cold: 'monsters' 'have' percentage 'of' 'physical' 'damage' 'as' 'extra' 'cold' 'damage';
// map_mon_phys_as_extra_fire 8 2 MapMonHave MapMonHave MapPhysExtraFire
map_mon_phys_as_extra_fire: 'monsters' 'have' percentage 'of' 'physical' 'damage' 'as' 'extra' 'fire' 'damage';
// map_mon_phys_as_extra_pois 8 2 MapMonHave MapMonHave MapPhysExtraPois
map_mon_phys_as_extra_pois: 'monsters' 'have' percentage 'of' 'physical' 'damage' 'as' 'extra' 'poison' 'damage' 'over' exact_integer 'seconds';
// map_mon_phys_as_extra_mag 8 2 MapMonHave MapMonHave MapPhysExtraMag
map_mon_phys_as_extra_mag: 'monsters' 'have' percentage 'of' 'physical' 'damage' 'as' 'extra' 'magic' 'damage';
// map_glob_add_mon_doll 3 0 MapAddMonDoll MapAddMonDoll 
map_glob_add_mon_doll: 'map' 'contains' 'stygian' 'dolls';
// map_glob_add_mon_succ 3 0 MapAddMonSucc MapAddMonSucc 
map_glob_add_mon_succ: 'map' 'contains' 'succubus' 'witches';
// map_glob_add_mon_vamp 3 0 MapAddMonVamp MapAddMonVamp 
map_glob_add_mon_vamp: 'map' 'contains' 'vampire' 'lords';
// map_glob_add_mon_cow 3 0 MapAddMonCow MapAddMonCow 
map_glob_add_mon_cow: 'map' 'contains' 'hell' 'bovines';
// map_glob_add_mon_horde 3 0 MapAddMonHorde MapAddMonHorde 
map_glob_add_mon_horde: 'map' 'contains' 'reanimated' 'horde';
// map_glob_add_mon_ghost 3 0 MapAddMonGhost MapAddMonGhost 
map_glob_add_mon_ghost: 'map' 'contains' 'ghosts';
// extra_bonespears 9 2 StrExtraBonespear StrExtraBonespear StrExtraBonespear2
extra_bonespears: 'bonespear' 'now' 'fires' percentage 'additional' 'spears';
// extra_revives 9 2 StrExtraRevives StrExtraRevives StrExtraRevives2
extra_revives: 'you' 'may' 'summon' percentage 'additional' 'revives';
// immune_stat 4 1 ModitemdamFiresk ModitemdamFiresk 
immune_stat: percentage 'to' 'fire' 'skill' 'damage';
// mon_cooldown1 4 1 ModitemdamFiresk ModitemdamFiresk 
mon_cooldown1: percentage 'to' 'fire' 'skill' 'damage';
// mon_cooldown2 4 1 ModitemdamFiresk ModitemdamFiresk 
mon_cooldown2: percentage 'to' 'fire' 'skill' 'damage';
// mon_cooldown3 4 1 ModitemdamFiresk ModitemdamFiresk 
mon_cooldown3: percentage 'to' 'fire' 'skill' 'damage';
// map_mon_deadlystrike 7 2 MapMonHave MapMonHave ModStr5q
map_mon_deadlystrike: 'monsters' 'have' percentage 'deadly' 'strike';
// map_mon_cannotbefrozen 9 0 MapMonHave MapMonHave ModStr5z
map_mon_cannotbefrozen: 'monsters' 'have' 'cannot' 'be' 'frozen';
// map_play_fasterattackrate 7 2 MapPlayHave MapPlayHave ModStr4m
map_play_fasterattackrate: 'players' 'have' percentage 'increased' 'attack' 'speed';
// dgrp7 7 2 MapPlayHave MapPlayHave MapAtkCastSpeed
dgrp7: 'players' 'have' percentage 'attack' 'and' 'cast' 'speed';
// map_play_fastercastrate 7 2 MapPlayHave MapPlayHave ModStr4v
map_play_fastercastrate: 'players' 'have' percentage 'faster' 'cast' 'rate';
// map_mon_skillondeath 15  Moditemskondeath Moditemskondeath 
map_mon_skillondeath: percentage 'chance' 'to' 'cast' 'level' percentage any_skill 'when' 'you' 'die';
// map_play_maxhp_percent 7 2 MapPlayHave MapPlayHave ModStr2g
map_play_maxhp_percent: 'players' 'have' percentage 'increase' 'maximum' 'life';
// map_play_maxmana_percent 7 2 MapPlayHave MapPlayHave ModStr2h
map_play_maxmana_percent: 'players' 'have' percentage 'increase' 'maximum' 'mana';
// map_play_damageresist 7 2 MapPlayHave MapPlayHave ModStrMapPlayerPDR
map_play_damageresist: 'players' 'have' percentage 'reduced' 'physical' 'damage' 'reduction';
// map_play_velocitypercent 7 2 MapPlayHave MapPlayHave ModVelocity
map_play_velocitypercent: 'players' 'have' percentage 'to' 'velocity';
// heroic 3 0 StrHeroic StrHeroic 
heroic: 'heroic';
// extra_spirits 9 2 StrExtraRevives StrExtraRevives StrExtraSpirits
extra_spirits: 'you' 'may' 'summon' percentage 'additional' 'spirit';
// gustreduction 3 0 GustReduction GustReduction 
gustreduction: 'gust' 'cooldown' 'reduced' 'by' exact_integer 'seconds';
// extra_skele_war 9 2 YouMaySummon YouMaySummon ExtraSkeleWar
extra_skele_war: 'you' 'may' 'summon' percentage 'additional' 'skeleton' 'warriors';
// extra_skele_mage 9 2 YouMaySummon YouMaySummon ExtraSkeleMage
extra_skele_mage: 'you' 'may' 'summon' percentage 'additional' 'skeleton' 'mages';
// extra_hydra 9 2 YouMaySummon YouMaySummon ExtraHydra
extra_hydra: 'you' 'may' 'summon' percentage 'additional' 'hydra';
// extra_valk 9 2 YouMaySummon YouMaySummon ExtraValk
extra_valk: 'you' 'may' 'summon' percentage 'additional' 'valkyrie';
// joustreduction 3 0 joustreduction joustreduction 
joustreduction: 'joust' 'cooldown' 'reduced' 'by' '0.5' 'seconds';
// grims_extra_skele_mage 3 0 ExtraSkeleMageGrim ExtraSkeleMageGrim 
grims_extra_skele_mage: 'you' 'may' 'summon' exact_integer 'additional' 'skeleton' 'mages';
// map_play_lightradius 9 2 MapPlayHave MapPlayHave StrMapLightRadius
map_play_lightradius: 'players' 'have' percentage 'reduced' 'light' 'radius';
// blood_warp_life_reduction 3 0 bloodwarplifereduction bloodwarplifereduction 
blood_warp_life_reduction: 'bloodwarp' 'costs' exact_integer 'less' 'health';
// map_glob_add_mon_souls 3 0 MapAddMonSouls MapAddMonSouls 
map_glob_add_mon_souls: 'map' 'contains' 'burning' 'souls';
// map_glob_add_mon_fetish 3 0 MapAddMonFetish MapAddMonFetish 
map_glob_add_mon_fetish: 'map' 'contains' 'fetishes';
// dclone_clout 3 0 DcloneClout DcloneClout 
dclone_clout: 'top' 'three' 'diablo' 'clone' 'killer' '(' 'class' 'specific' ')';
// maxlevel_clout 3 0 MaxlevelClout MaxlevelClout 
maxlevel_clout: 'top' 'three' 'to' 'reach' 'level' exact_integer '(' 'class' 'specific' ')';
// dev_clout 3 0 DevClout DevClout 
dev_clout: 'untold' 'power' 'is' 'contained' 'within';
// extra_skele_archer 9 2 YouMaySummon YouMaySummon ExtraSkeleArcher
extra_skele_archer: 'you' 'may' 'summon' percentage 'additional' 'skeleton' 'archers';
// extra_golem 9 2 YouMaySummon YouMaySummon ExtraGolem
extra_golem: 'you' 'may' 'summon' percentage 'additional' 'golem';
// inc_splash_radius 3 0 IncSplash IncSplash 
inc_splash_radius: 'melee' 'splash' 'radius' 'increased' 'by' exact_integer;
// item_numsockets_textonly 3  SocketedTextOnly SocketedTextOnly 
item_numsockets_textonly: 'socketed' '[1]';
// rathma_clout 3 0 RathmaClout RathmaClout 
rathma_clout: 'top' 'three' 'rathma' 'killer' '(' 'class' 'specific' ')';
// dragonflightreduction 3 0 dragonflightreduction dragonflightreduction 
dragonflightreduction: 'dragon' 'flight' 'cooldown' 'reduced' 'by' '0.5' 'seconds';
// item_dmgpercent_pereth 8 1 ModStrEnhancedDamage ModStrEnhancedDamage increaseswithequippedeth
item_dmgpercent_pereth: percentage 'enhanced' 'damage' '(' 'based' 'on' 'equipped' 'ethereals' ')' 'gains' exact_integer 'enhanced' 'damage' 'per' 'equipped' 'ethereal' 'item';
// corpseexplosionradius 3 0 corpseexplosionradius corpseexplosionradius 
corpseexplosionradius: 'corpse' 'explosion' 'radius' 'increased' 'by' exact_integer 'yards';
// mirrored 3 0 StrMirrored StrMirrored 
mirrored: 'mirrored';
// item_dmgpercent_permissinghppercent 8 1 ModStrEnhancedDamage ModStrEnhancedDamage increaseswithmissinghp
item_dmgpercent_permissinghppercent: percentage 'enhanced' 'damage' '(' 'based' 'on' 'missing' 'life' ')' 'gains' exact_integer 'enhanced' 'damage' 'per' 'missing' 'life' 'percentage';
// lifedrain_percentcap 7 2 ModStrLifeStealCap ModStrLifeStealCap ofmaximumhp
lifedrain_percentcap: 'you' 'cannot' 'life' 'steal' 'when' 'above' percentage 'maximum' 'life';
// inc_splash_radius_permissinghp 8 1 ModStrIncSplashRadius ModStrIncSplashRadius incsplashwithmissinghp
inc_splash_radius_permissinghp: percentage 'increased' 'splash' 'radius' '(' 'based' 'on' 'missing' 'life' ')';
// eaglehorn_raven 6 2 EaglehornRaven EaglehornRaven ColdDamage
eaglehorn_raven: 'your' 'ravens' 'deal' percentage 'cold' 'damage';
// map_glob_skirmish_mode 3 0 MapGlobSkirmishMode MapGlobSkirmishMode 
map_glob_skirmish_mode: 'fortified';
// map_mon_dropjewelry 8 2 MapMonHave MapMonHave MapMonIncreasedJewelry
map_mon_dropjewelry: 'monsters' 'have' percentage 'chance' 'of' 'dropping' 'additional' 'jewelry' 'and' 'charms';
// map_mon_dropweapons 8 2 MapMonHave MapMonHave MapMonIncreasedWeapons
map_mon_dropweapons: 'monsters' 'have' percentage 'chance' 'of' 'dropping' 'additional' 'weapons';
// map_mon_droparmor 8 2 MapMonHave MapMonHave MapMonIncreasedArmor
map_mon_droparmor: 'monsters' 'have' percentage 'chance' 'of' 'dropping' 'additional' 'armor';
// map_mon_dropcrafting 8 2 MapMonHave MapMonHave MapMonIncreasedCrafting
map_mon_dropcrafting: 'monsters' 'have' percentage 'chance' 'of' 'dropping' 'additional' 'crafting' 'materials';
// map_glob_extra_boss 3 0 MapGlobExtraBoss MapGlobExtraBoss 
map_glob_extra_boss: 'map' 'contains' 'an' 'additional' 'boss';
// map_glob_add_mon_shriek 3 0 MapAddMonShriek MapAddMonShriek 
map_glob_add_mon_shriek: 'map' 'contains' 'minions' 'of' 'destruction';
// map_force_event 3 0 StrForceMapEvent StrForceMapEvent 
map_force_event: 'map' 'contains' 'a' 'random' 'event';
// deep_wounds 1 1 OpenWoundsItem OpenWoundsItem 
deep_wounds: percentage 'open' 'wounds' 'damage' 'per' 'second';
// map_mon_dropcharms 8 2 MapMonHave MapMonHave MapMonIncreasedCharms
map_mon_dropcharms: 'monsters' 'have' percentage 'chance' 'of' 'dropping' 'additional' 'charms';
// map_glob_dropcorrupted 8 2 MapMonHave MapMonHave MapMonIncreasedCorrupted
map_glob_dropcorrupted: 'monsters' 'have' percentage 'chance' 'of' 'dropping' 'corrupted' 'items';
// curse_effectiveness 4 2 StrCurseEffectiveness StrCurseEffectiveness 
curse_effectiveness: 'curse' 'resistance' percentage;
// map_glob_boss_dropfacet 3 0 MapBossFacet MapBossFacet 
map_glob_boss_dropfacet: 'map' 'boss' 'drops' 'a' 'rainbow' 'facet';
// map_mon_dropjewels 8 2 MapMonHave MapMonHave MapMonIncreasedJewels
map_mon_dropjewels: 'monsters' 'have' percentage 'chance' 'of' 'dropping' 'additional' 'jewels';
// map_glob_sundermonsters 3 0 MapGlobSunderMonsters MapGlobSunderMonsters 
map_glob_sundermonsters: 'monsters' 'have' 'sundered' 'resistances';
// extra_grizzly 9 2 YouMaySummon YouMaySummon ExtraGrizzly
extra_grizzly: 'you' 'may' 'summon' percentage 'additional' 'grizzlies';
// no_wolves 3 0 StrNoWolves StrNoWolves 
no_wolves: 'you' 'may' 'no' 'longer' 'summon' 'wolves';
any_skill: ('attack' | 'kick' | 'throw' | 'unsummon' | 'left' 'hand' 'throw' | 'left' 'hand' 'swing' | 'magic' 'arrow' | 'fire' 'arrow' | 'inner' 'sight' | 'critical' 'strike' | 'jab' | 'cold' 'arrow' | 'multiple' 'shot' | 'dodge' | 'power' 'strike' | 'poison' 'javelin' | 'exploding' 'arrow' | 'slow' 'movement' | 'avoid' | 'javelin' 'and' 'spear' 'mastery' | 'lightning' 'bolt' | 'ice' 'arrow' | 'guided' 'arrow' | 'penetrate' | 'charged' 'strike' | 'plague' 'javelin' | 'strafe' | 'immolation' 'arrow' | 'decoy' | 'dopplezon' | 'evade' | 'fend' | 'freezing' 'arrow' | 'valkyrie' | 'pierce' | 'lightning' 'strike' | 'lightning' 'fury' | 'fire' 'bolt' | 'warmth' | 'charged' 'bolt' | 'ice' 'bolt' | 'cold' 'enchant' | 'inferno' | 'static' 'field' | 'telekinesis' | 'frost' 'nova' | 'ice' 'blast' | 'blaze' | 'fire' 'ball' | 'nova' | 'lightning' | 'shiver' 'armor' | 'fire' 'wall' | 'enchant' 'fire' | 'enchant' | 'chain' 'lightning' | 'teleport' | 'glacial' 'spike' | 'meteor' | 'thunder' 'storm' | 'energy' 'shield' | 'blizzard' | 'chilling' 'armor' | 'fire' 'mastery' | 'hydra' | 'lightning' 'mastery' | 'frozen' 'orb' | 'cold' 'mastery' | 'amplify' 'damage' | 'ampdmg' | 'teeth' | 'bone' 'armor' | 'skeleton' 'mastery' | 'raise' 'skeleton' 'warrior' | 'raise' 'skeleton' | 'dim' 'vision' | 'weaken' | 'poison' 'strike' | 'poison' 'dagger' | 'corpse' 'explosion' | 'clay' 'golem' | 'iron' 'maiden' | 'terror' | 'bone' 'wall' | 'golem' 'mastery' | 'raise' 'skeletal' 'mage' | 'confuse' | 'life' 'tap' | 'desecrate' | 'bone' 'spear' | 'blood' 'golem' | 'bloodgolem' | 'attract' | 'decrepify' | 'bone' 'prison' | 'raise' 'skeleton' 'archer' | 'iron' 'golem' | 'irongolem' | 'lower' 'resist' | 'lowres' | 'poison' 'nova' | 'bone' 'spirit' | 'fire' 'golem' | 'firegolem' | 'revive' | 'sacrifice' | 'smite' | 'might' | 'prayer' | 'resist' 'fire' | 'holy' 'bolt' | 'holy' 'fire' | 'thorns' | 'defiance' | 'resist' 'cold' | 'zeal' | 'charge' | 'blessed' 'aim' | 'cleansing' | 'resist' 'lightning' | 'vengeance' | 'blessed' 'hammer' | 'concentration' | 'holy' 'freeze' | 'vigor' | 'holy' 'sword' | 'holy' 'shield' | 'holy' 'shock' | 'sanctuary' | 'meditation' | 'fist' 'of' 'the' 'heavens' | 'fanaticism' | 'conviction' | 'redemption' | 'salvation' | 'bash' | 'sword' 'mastery' | 'general' 'mastery' | 'mace' 'mastery' | 'howl' | 'find' 'potion' | 'leap' | 'double' 'swing' | 'polearm' 'and' 'spear' 'mastery' | 'pole' 'arm' 'and' 'spear' 'mastery' | 'throwing' 'mastery' | 'spear' 'mastery' | 'taunt' | 'shout' | 'stun' | 'double' 'throw' | 'combat' 'reflexes' | 'find' 'item' | 'leap' 'attack' | 'concentrate' | 'iron' 'skin' | 'battle' 'cry' | 'frenzy' | 'increased' 'speed' | 'battle' 'orders' | 'grim' 'ward' | 'whirlwind' | 'berserk' | 'natural' 'resistance' | 'war' 'cry' | 'battle' 'command' | 'vampiremeteor' | 'scroll' 'of' 'identify' | 'tome' 'of' 'identify' | 'book' 'of' 'identify' | 'scroll' 'of' 'townportal' | 'tome' 'of' 'townportal' | 'book' 'of' 'townportal' | 'raven' | 'poison' 'creeper' | 'plague' 'poppy' | 'werewolf' | 'wearwolf' | 'lycanthropy' | 'shape' 'shifting' | 'firestorm' | 'oak' 'sage' | 'summon' 'spirit' 'wolf' | 'werebear' | 'wearbear' | 'molten' 'boulder' | 'arctic' 'blast' | 'carrion' 'vine' | 'cycle' 'of' 'life' | 'feral' 'rage' | 'maul' | 'fissure' | 'eruption' | 'cyclone' 'armor' | 'heart' 'of' 'wolverine' | 'summon' 'dire' 'wolf' | 'summon' 'fenris' | 'rabies' | 'fire' 'claws' | 'twister' | 'solar' 'creeper' | 'vines' | 'hunger' | 'shock' 'wave' | 'volcano' | 'tornado' | 'spirit' 'of' 'barbs' | 'summon' 'grizzly' | 'fury' | 'armageddon' | 'hurricane' | 'fire' 'blast' | 'fire' 'trauma' | 'claw' 'and' 'dagger' 'mastery' | 'claw' 'mastery' | 'psychic' 'hammer' | 'tiger' 'strike' | 'dragon' 'talon' | 'shock' 'web' | 'shock' 'field' | 'blade' 'sentinel' | 'burst' 'of' 'speed' | 'quickness' | 'fists' 'of' 'fire' | 'dragon' 'claw' | 'charged' 'bolt' 'sentry' | 'wake' 'of' 'fire' | 'wake' 'of' 'fire' 'sentry' | 'weapon' 'block' | 'cloak' 'of' 'shadows' | 'cobra' 'strike' | 'blade' 'fury' | 'fade' | 'shadow' 'warrior' | 'claws' 'of' 'thunder' | 'dragon' 'tail' | 'chain' 'lightning' 'sentry' | 'wake' 'of' 'inferno' | 'inferno' 'sentry' | 'mind' 'blast' | 'blades' 'of' 'ice' | 'dragon' 'flight' | 'death' 'sentry' | 'blade' 'shield' | 'venom' | 'shadow' 'master' | 'phoenix' 'strike' | 'royal' 'strike' | 'delirium' | 'delerium' 'change' | 'blink' | 'battleorderscta' | 'bloodravenimmo' | 'holy' 'nova' | 'shattering' 'arrow' | 'lightning' 'sentry' | 'blood' 'warp' | 'deep' 'wounds' | 'ice' 'barrage' | 'gust' | 'holy' 'light' | 'curse' 'mastery' | 'curmas' | 'combustion' | 'joust' | 'dark' 'pact' | 'lesser' 'hydra' | 'merc' 'fire' 'arrow' | 'merc' 'cold' 'arrow' | 'vampire' 'form' | 'lesser' 'fade' | 'move' 'only' | 'force' 'move' | 'bone' 'nova' | 'fingermagebossnova' | 'monleap' | 'monjab' | 'monsmite' | 'moncharge' | 'monholyfreeze' | 'monglacialspike' | 'monfrostnova' | 'monfireball' | 'monweaken' | 'monhydra' | 'monlightning' | 'monwhirlwind' | 'monshout' | 'mondecrepify' | 'monchainlightning' | 'monchillingarmor' | 'uberdiablometeor' | 'uberdiabloboulder' | 'wispbosschainlightning' | 'wispminionlightning' | 'wisptotemconviction' | 'monleapattack' | 'ampdmg' 'proc' | 'weaken' 'proc' | 'iron' 'maiden' 'proc' | 'life' 'tap' 'proc' | 'decrepify' 'proc' | 'lowres' 'proc' | 'iceboss' 'freezing' 'arrow' | 'iceboss' 'blizzard' | 'lightning' 'strike' 'cowboss' | 'poison' 'nova' 'tomb' 'boss' | 'power' 'strike' 'tomb' 'boss' | 'hydra' 'throne' 'boss' | 'hurricanetortureboss' | 'merc' 'static' 'field' | 'a3' 'merc' 'lightning' | 'a3' 'merc' 'meteor' | 'a3' 'merc' 'fire' 'ball' | 'a3' 'merc' 'blizzard' | 'a3' 'merc' 'ice' 'blast' | 'traitorbossblessedaim' | 'traitorbossvigor' | 'traitorbossconejab' | 'traitorbossstunspear' | 'archerbossarrowrain' | 'archerbossboomershot' | 'archerbosscageshot' | 'mon' 'conviction' | 'mon' 'fanaticism' | 'mon' 'holy' 'shock' | 'mon' 'holy' 'freeze' | 'mon' 'holy' 'fire' | 'mon' 'might' | 'mon' 'concentration' | 'mon' 'vigor' | 'baal' 'lowres' | 'poison' 'dagger' 'spider' 'boss' | 'tornado' 'arcane' 'boss' | 'valk' 'power' 'strike' | 'rathmabonespear' | 'rathmateethnova' | 'iskatuhurricane' | 'rathmafissure' | 'rathmaouternova' | 'frost' 'nova' 'horror' 'boss' | 'mon' 'holy' 'freeze' 'wide' | 'rathmapacman' | 'shock' 'wave' 'boss' | 'glacial' 'spike' 'spire' | 'poison' 'nova' 'rathma' | 'teeth' 'rathma' | 'ubertalicblaze' | 'ubertalicwhirlwind' | 'ubertalicbash' | 'ubertalicmeteor' | 'identify' 'all' | 'book' 'of' 'unlimited' 'identify' | 'create' 'townportal' | 'book' 'of' 'unlimited' 'townportal' | 'brutefireslam' | 'brutemoltenboulder' | 'bruteshockwave' | 'brutevigor' | 'ubertalicsmite' | 'ubermadawcfakebo' | 'ubermadawclightningstorm' | 'cyclone' 'armormon' | 'siegebeastclusterbomb' | 'siegebeastfirenova' | 'siegebeastorb' | 'holy' 'fire' 'fire' 'golem' | 'holy' 'freeze' 'korlic' | 'leap' 'attack' 'korlic' | 'holy' 'fire' 'sanctuaryboss' | 'howl' 'monster' | 'bone' 'spear' 'serpent' | 'fire' 'ball' 'ashen' 'boss' | 'fire' 'nova' | 'zharbarrage' | 'zhararmageddon' | 'zharcloak' | 'merc' 'magic' 'arrow' | 'a4' 'ampdmg' | 'energy' 'shield' 'selfaura' | 'chilling' 'armor' 'selfaura' | 'quickness' 'selfaura' | 'blade' 'shield' 'selfaura' | 'rakanothstrike' | 'kanemithfirestorm' | 'kanemithshockweb' | 'sharptoothunholyorb' | 'sharptoothchainpoison' | 'wispbossnova' | 'radamentbossmeteor' | 'luciondash' | 'eruptiondemonroadboss' | 'tentacle' | 'lucioncharge' | 'monsmitelucion' | 'monlowerres' | 'bone' 'spear' 'putrid' 'defiler' | 'chargedboltimperialminiboss' | 'armageddon' 'selfaura' | 'shock' 'field' 'ureh' 'boss' | 'fire' 'trauma' 'ureh' 'boss');
class_only_skill: ('magic' 'arrow' '(' class 'only' ')' | 'fire' 'arrow' '(' class 'only' ')' | 'inner' 'sight' '(' class 'only' ')' | 'critical' 'strike' '(' class 'only' ')' | 'jab' '(' class 'only' ')' | 'cold' 'arrow' '(' class 'only' ')' | 'multiple' 'shot' '(' class 'only' ')' | 'dodge' '(' class 'only' ')' | 'power' 'strike' '(' class 'only' ')' | 'poison' 'javelin' '(' class 'only' ')' | 'exploding' 'arrow' '(' class 'only' ')' | 'slow' 'movement' '(' class 'only' ')' | 'avoid' '(' class 'only' ')' | 'javelin' 'and' 'spear' 'mastery' '(' class 'only' ')' | 'lightning' 'bolt' '(' class 'only' ')' | 'ice' 'arrow' '(' class 'only' ')' | 'guided' 'arrow' '(' class 'only' ')' | 'penetrate' '(' class 'only' ')' | 'charged' 'strike' '(' class 'only' ')' | 'plague' 'javelin' '(' class 'only' ')' | 'strafe' '(' class 'only' ')' | 'immolation' 'arrow' '(' class 'only' ')' | 'decoy' '(' class 'only' ')' | 'dopplezon' '(' class 'only' ')' | 'evade' '(' class 'only' ')' | 'fend' '(' class 'only' ')' | 'freezing' 'arrow' '(' class 'only' ')' | 'valkyrie' '(' class 'only' ')' | 'pierce' '(' class 'only' ')' | 'lightning' 'strike' '(' class 'only' ')' | 'lightning' 'fury' '(' class 'only' ')' | 'fire' 'bolt' '(' class 'only' ')' | 'warmth' '(' class 'only' ')' | 'charged' 'bolt' '(' class 'only' ')' | 'ice' 'bolt' '(' class 'only' ')' | 'cold' 'enchant' '(' class 'only' ')' | 'inferno' '(' class 'only' ')' | 'static' 'field' '(' class 'only' ')' | 'telekinesis' '(' class 'only' ')' | 'frost' 'nova' '(' class 'only' ')' | 'ice' 'blast' '(' class 'only' ')' | 'blaze' '(' class 'only' ')' | 'fire' 'ball' '(' class 'only' ')' | 'nova' '(' class 'only' ')' | 'lightning' '(' class 'only' ')' | 'shiver' 'armor' '(' class 'only' ')' | 'fire' 'wall' '(' class 'only' ')' | 'enchant' 'fire' '(' class 'only' ')' | 'enchant' '(' class 'only' ')' | 'chain' 'lightning' '(' class 'only' ')' | 'teleport' '(' class 'only' ')' | 'glacial' 'spike' '(' class 'only' ')' | 'meteor' '(' class 'only' ')' | 'thunder' 'storm' '(' class 'only' ')' | 'energy' 'shield' '(' class 'only' ')' | 'blizzard' '(' class 'only' ')' | 'chilling' 'armor' '(' class 'only' ')' | 'fire' 'mastery' '(' class 'only' ')' | 'hydra' '(' class 'only' ')' | 'lightning' 'mastery' '(' class 'only' ')' | 'frozen' 'orb' '(' class 'only' ')' | 'cold' 'mastery' '(' class 'only' ')' | 'amplify' 'damage' '(' class 'only' ')' | 'ampdmg' '(' class 'only' ')' | 'teeth' '(' class 'only' ')' | 'bone' 'armor' '(' class 'only' ')' | 'skeleton' 'mastery' '(' class 'only' ')' | 'raise' 'skeleton' 'warrior' '(' class 'only' ')' | 'raise' 'skeleton' '(' class 'only' ')' | 'dim' 'vision' '(' class 'only' ')' | 'weaken' '(' class 'only' ')' | 'poison' 'strike' '(' class 'only' ')' | 'poison' 'dagger' '(' class 'only' ')' | 'corpse' 'explosion' '(' class 'only' ')' | 'clay' 'golem' '(' class 'only' ')' | 'iron' 'maiden' '(' class 'only' ')' | 'terror' '(' class 'only' ')' | 'bone' 'wall' '(' class 'only' ')' | 'golem' 'mastery' '(' class 'only' ')' | 'raise' 'skeletal' 'mage' '(' class 'only' ')' | 'confuse' '(' class 'only' ')' | 'life' 'tap' '(' class 'only' ')' | 'desecrate' '(' class 'only' ')' | 'bone' 'spear' '(' class 'only' ')' | 'blood' 'golem' '(' class 'only' ')' | 'bloodgolem' '(' class 'only' ')' | 'attract' '(' class 'only' ')' | 'decrepify' '(' class 'only' ')' | 'bone' 'prison' '(' class 'only' ')' | 'raise' 'skeleton' 'archer' '(' class 'only' ')' | 'iron' 'golem' '(' class 'only' ')' | 'irongolem' '(' class 'only' ')' | 'lower' 'resist' '(' class 'only' ')' | 'lowres' '(' class 'only' ')' | 'poison' 'nova' '(' class 'only' ')' | 'bone' 'spirit' '(' class 'only' ')' | 'fire' 'golem' '(' class 'only' ')' | 'firegolem' '(' class 'only' ')' | 'revive' '(' class 'only' ')' | 'sacrifice' '(' class 'only' ')' | 'smite' '(' class 'only' ')' | 'might' '(' class 'only' ')' | 'prayer' '(' class 'only' ')' | 'resist' 'fire' '(' class 'only' ')' | 'holy' 'bolt' '(' class 'only' ')' | 'holy' 'fire' '(' class 'only' ')' | 'thorns' '(' class 'only' ')' | 'defiance' '(' class 'only' ')' | 'resist' 'cold' '(' class 'only' ')' | 'zeal' '(' class 'only' ')' | 'charge' '(' class 'only' ')' | 'blessed' 'aim' '(' class 'only' ')' | 'cleansing' '(' class 'only' ')' | 'resist' 'lightning' '(' class 'only' ')' | 'vengeance' '(' class 'only' ')' | 'blessed' 'hammer' '(' class 'only' ')' | 'concentration' '(' class 'only' ')' | 'holy' 'freeze' '(' class 'only' ')' | 'vigor' '(' class 'only' ')' | 'holy' 'sword' '(' class 'only' ')' | 'holy' 'shield' '(' class 'only' ')' | 'holy' 'shock' '(' class 'only' ')' | 'sanctuary' '(' class 'only' ')' | 'meditation' '(' class 'only' ')' | 'fist' 'of' 'the' 'heavens' '(' class 'only' ')' | 'fanaticism' '(' class 'only' ')' | 'conviction' '(' class 'only' ')' | 'redemption' '(' class 'only' ')' | 'salvation' '(' class 'only' ')' | 'bash' '(' class 'only' ')' | 'sword' 'mastery' '(' class 'only' ')' | 'general' 'mastery' '(' class 'only' ')' | 'mace' 'mastery' '(' class 'only' ')' | 'howl' '(' class 'only' ')' | 'find' 'potion' '(' class 'only' ')' | 'leap' '(' class 'only' ')' | 'double' 'swing' '(' class 'only' ')' | 'polearm' 'and' 'spear' 'mastery' '(' class 'only' ')' | 'pole' 'arm' 'and' 'spear' 'mastery' '(' class 'only' ')' | 'throwing' 'mastery' '(' class 'only' ')' | 'spear' 'mastery' '(' class 'only' ')' | 'taunt' '(' class 'only' ')' | 'shout' '(' class 'only' ')' | 'stun' '(' class 'only' ')' | 'double' 'throw' '(' class 'only' ')' | 'combat' 'reflexes' '(' class 'only' ')' | 'find' 'item' '(' class 'only' ')' | 'leap' 'attack' '(' class 'only' ')' | 'concentrate' '(' class 'only' ')' | 'iron' 'skin' '(' class 'only' ')' | 'battle' 'cry' '(' class 'only' ')' | 'frenzy' '(' class 'only' ')' | 'increased' 'speed' '(' class 'only' ')' | 'battle' 'orders' '(' class 'only' ')' | 'grim' 'ward' '(' class 'only' ')' | 'whirlwind' '(' class 'only' ')' | 'berserk' '(' class 'only' ')' | 'natural' 'resistance' '(' class 'only' ')' | 'war' 'cry' '(' class 'only' ')' | 'battle' 'command' '(' class 'only' ')' | 'raven' '(' class 'only' ')' | 'poison' 'creeper' '(' class 'only' ')' | 'plague' 'poppy' '(' class 'only' ')' | 'werewolf' '(' class 'only' ')' | 'wearwolf' '(' class 'only' ')' | 'lycanthropy' '(' class 'only' ')' | 'shape' 'shifting' '(' class 'only' ')' | 'firestorm' '(' class 'only' ')' | 'oak' 'sage' '(' class 'only' ')' | 'summon' 'spirit' 'wolf' '(' class 'only' ')' | 'werebear' '(' class 'only' ')' | 'wearbear' '(' class 'only' ')' | 'molten' 'boulder' '(' class 'only' ')' | 'arctic' 'blast' '(' class 'only' ')' | 'carrion' 'vine' '(' class 'only' ')' | 'cycle' 'of' 'life' '(' class 'only' ')' | 'feral' 'rage' '(' class 'only' ')' | 'maul' '(' class 'only' ')' | 'fissure' '(' class 'only' ')' | 'eruption' '(' class 'only' ')' | 'cyclone' 'armor' '(' class 'only' ')' | 'heart' 'of' 'wolverine' '(' class 'only' ')' | 'summon' 'dire' 'wolf' '(' class 'only' ')' | 'summon' 'fenris' '(' class 'only' ')' | 'rabies' '(' class 'only' ')' | 'fire' 'claws' '(' class 'only' ')' | 'twister' '(' class 'only' ')' | 'solar' 'creeper' '(' class 'only' ')' | 'vines' '(' class 'only' ')' | 'hunger' '(' class 'only' ')' | 'shock' 'wave' '(' class 'only' ')' | 'volcano' '(' class 'only' ')' | 'tornado' '(' class 'only' ')' | 'spirit' 'of' 'barbs' '(' class 'only' ')' | 'summon' 'grizzly' '(' class 'only' ')' | 'fury' '(' class 'only' ')' | 'armageddon' '(' class 'only' ')' | 'hurricane' '(' class 'only' ')' | 'fire' 'blast' '(' class 'only' ')' | 'fire' 'trauma' '(' class 'only' ')' | 'claw' 'and' 'dagger' 'mastery' '(' class 'only' ')' | 'claw' 'mastery' '(' class 'only' ')' | 'psychic' 'hammer' '(' class 'only' ')' | 'tiger' 'strike' '(' class 'only' ')' | 'dragon' 'talon' '(' class 'only' ')' | 'shock' 'web' '(' class 'only' ')' | 'shock' 'field' '(' class 'only' ')' | 'blade' 'sentinel' '(' class 'only' ')' | 'burst' 'of' 'speed' '(' class 'only' ')' | 'quickness' '(' class 'only' ')' | 'fists' 'of' 'fire' '(' class 'only' ')' | 'dragon' 'claw' '(' class 'only' ')' | 'charged' 'bolt' 'sentry' '(' class 'only' ')' | 'wake' 'of' 'fire' '(' class 'only' ')' | 'wake' 'of' 'fire' 'sentry' '(' class 'only' ')' | 'weapon' 'block' '(' class 'only' ')' | 'cloak' 'of' 'shadows' '(' class 'only' ')' | 'cobra' 'strike' '(' class 'only' ')' | 'blade' 'fury' '(' class 'only' ')' | 'fade' '(' class 'only' ')' | 'shadow' 'warrior' '(' class 'only' ')' | 'claws' 'of' 'thunder' '(' class 'only' ')' | 'dragon' 'tail' '(' class 'only' ')' | 'chain' 'lightning' 'sentry' '(' class 'only' ')' | 'wake' 'of' 'inferno' '(' class 'only' ')' | 'inferno' 'sentry' '(' class 'only' ')' | 'mind' 'blast' '(' class 'only' ')' | 'blades' 'of' 'ice' '(' class 'only' ')' | 'dragon' 'flight' '(' class 'only' ')' | 'death' 'sentry' '(' class 'only' ')' | 'blade' 'shield' '(' class 'only' ')' | 'venom' '(' class 'only' ')' | 'shadow' 'master' '(' class 'only' ')' | 'phoenix' 'strike' '(' class 'only' ')' | 'royal' 'strike' '(' class 'only' ')' | 'holy' 'nova' '(' class 'only' ')' | 'shattering' 'arrow' '(' class 'only' ')' | 'lightning' 'sentry' '(' class 'only' ')' | 'blood' 'warp' '(' class 'only' ')' | 'deep' 'wounds' '(' class 'only' ')' | 'ice' 'barrage' '(' class 'only' ')' | 'gust' '(' class 'only' ')' | 'holy' 'light' '(' class 'only' ')' | 'curse' 'mastery' '(' class 'only' ')' | 'curmas' '(' class 'only' ')' | 'combustion' '(' class 'only' ')' | 'joust' '(' class 'only' ')' | 'dark' 'pact' '(' class 'only' ')' | 'lesser' 'hydra' '(' class 'only' ')');
class: 'amazon' | 'sorceress' | 'necromancer' | 'paladin' | 'barbarian' | 'druid' | 'assassin';
property: (strength|dgrp1|energy|dexterity|vitality|maxhp|maxmana|maxstamina|item_armor_percent|item_maxdamage_percent|item_mindamage_percent|tohit|toblock|mindamage|maxdamage|secondary_mindamage|secondary_maxdamage|manarecoverybonus|staminarecoverybonus|armorclass|armorclass_vs_missile|armorclass_vs_hth|normal_damage_reduction|magic_damage_reduction|damageresist|magicresist|maxmagicresist|fireresist|dgrp2|maxfireresist|lightresist|maxlightresist|coldresist|maxcoldresist|poisonresist|maxpoisonresist|firemindam|firemaxdam|lightmindam|lightmaxdam|magicmindam|magicmaxdam|coldmindam|coldmaxdam|poisonmindam|poisonmaxdam|lifedrainmindam|manadrainmindam|hpregen|item_maxdurability_percent|item_maxhp_percent|item_maxmana_percent|item_attackertakesdamage|item_goldbonus|item_magicbonus|item_knockback|item_addclassskills|item_addexperience|item_healafterkill|item_reducedprices|item_lightradius|item_req_percent|item_fasterattackrate|item_fastermovevelocity|item_nonclassskill|item_fastergethitrate|item_fasterblockrate|item_fastercastrate|item_singleskill|item_restinpeace|curse_resistance|item_poisonlengthresist|item_normaldamage|item_howl|item_stupidity|item_damagetomana|item_ignoretargetac|item_fractionaltargetac|item_preventheal|item_halffreezeduration|item_tohit_percent|item_damagetargetac|item_demondamage_percent|item_undeaddamage_percent|item_demon_tohit|item_undead_tohit|item_throwable|item_allskills|item_attackertakeslightdamage|item_freeze|item_openwounds|item_crushingblow|item_kickdamage|item_manaafterkill|item_healafterdemonkill|item_deadlystrike|item_absorbfire_percent|item_absorbfire|item_absorblight_percent|item_absorblight|item_absorbmagic_percent|item_absorbmagic|item_absorbcold_percent|item_absorbcold|item_slow|item_aura|item_indesctructible|item_cannotbefrozen|item_staminadrainpct|item_reanimate|item_pierce|item_magicarrow|item_explosivearrow|attack_vs_montype|damage_vs_montype|uber_difficulty|map_glob_boss_dropskillers|map_glob_boss_dropcorruptedunique|item_addskill_tab|item_skillonequip|extra_shadow|extra_spiritwolf|item_skillonattack|item_skillonkill|item_skillondeath|item_skillonhit|item_skillonlevelup|item_skilloncast|item_skillongethit|item_skillonblock|item_skilloncrit|item_charged_skill|item_skillonpierce|desecrated|joustreduction_zeraes|item_maxdeadlystrike|map_glob_boss_dropubermats|map_glob_boss_droppuzzlebox|item_mindamage_energy|item_armor_perlevel|item_armorpercent_perlevel|item_hp_perlevel|item_mana_perlevel|item_maxdamage_perlevel|item_maxdamage_percent_perlevel|item_strength_perlevel|item_dexterity_perlevel|item_energy_perlevel|item_vitality_perlevel|item_tohit_perlevel|item_tohitpercent_perlevel|item_cold_damagemax_perlevel|item_fire_damagemax_perlevel|item_ltng_damagemax_perlevel|item_pois_damagemax_perlevel|item_resist_cold_perlevel|item_resist_fire_perlevel|item_resist_ltng_perlevel|item_resist_pois_perlevel|item_absorb_cold_perlevel|item_absorb_fire_perlevel|item_absorb_ltng_perlevel|item_thorns_perlevel|item_find_gold_perlevel|item_find_magic_perlevel|item_regenstamina_perlevel|item_stamina_perlevel|item_damage_demon_perlevel|item_damage_undead_perlevel|item_tohit_demon_perlevel|item_tohit_undead_perlevel|item_crushingblow_perlevel|item_openwounds_perlevel|item_kick_damage_perlevel|item_deadlystrike_perlevel|item_replenish_durability|item_replenish_quantity|item_extra_stack|item_crushingblow_efficiency|extra_cold_arrows|item_shiny_appearance|joustreduction_leorics|map_glob_dropsocketed|item_pierce_cold|item_pierce_fire|item_pierce_ltng|item_pierce_pois|passive_fire_mastery|passive_ltng_mastery|passive_cold_mastery|passive_pois_mastery|passive_fire_pierce|passive_ltng_pierce|passive_cold_pierce|passive_pois_pierce|passive_mag_mastery|item_splashonhit|corrupted|item_elemskill_cold|item_elemskill_fire|item_elemskill_lightning|item_elemskill_poison|item_elemskill_magic|max_curses|map_defense|map_play_magicbonus|dgrp6|map_play_goldbonus|map_glob_density|map_play_addexperience|map_glob_arealevel|map_glob_monsterrarity|map_mon_firemindam|map_mon_firemaxdam|map_mon_lightmindam|map_mon_lightmaxdam|map_mon_magicmindam|map_mon_magicmaxdam|map_mon_coldmindam|map_mon_coldmaxdam|map_mon_poisonmindam|map_mon_poisonmaxdam|map_mon_passive_fire_mastery|map_mon_passive_ltng_mastery|map_mon_passive_cold_mastery|map_mon_passive_pois_mastery|map_mon_fasterattackrate|dgrp4|map_mon_fastercastrate|map_mon_tohit|dgrp5|map_mon_acpercentage|map_mon_absorbcold_percent|map_mon_absorbmagic_percent|map_mon_absorblight_percent|map_mon_absorbfire_percent|map_mon_normal_damage_reduction|map_mon_velocitypercent|map_mon_hpregen|map_mon_lifedrainmindam|map_mon_fastergethitrate|map_mon_maxhp_percent|map_mon_pierce|map_mon_openwounds|map_mon_crushingblow|map_mon_curse_resistance|map_play_acpercentage|map_play_fastergethitrate|map_play_toblock|map_play_hpregen|map_play_maxfireresist|dgrp8|map_play_maxlightresist|map_play_maxcoldresist|map_play_maxpoisonresist|item_replenish_charges|item_leap_speed|item_healafterhit|passive_phys_pierce|map_mon_edpercentage|map_mon_splash|map_play_fireresist|dgrp3|map_play_lightresist|map_play_coldresist|map_play_poisonresist|map_mon_phys_as_extra_ltng|map_mon_phys_as_extra_cold|map_mon_phys_as_extra_fire|map_mon_phys_as_extra_pois|map_mon_phys_as_extra_mag|map_glob_add_mon_doll|map_glob_add_mon_succ|map_glob_add_mon_vamp|map_glob_add_mon_cow|map_glob_add_mon_horde|map_glob_add_mon_ghost|extra_bonespears|extra_revives|immune_stat|mon_cooldown1|mon_cooldown2|mon_cooldown3|map_mon_deadlystrike|map_mon_cannotbefrozen|map_play_fasterattackrate|dgrp7|map_play_fastercastrate|map_mon_skillondeath|map_play_maxhp_percent|map_play_maxmana_percent|map_play_damageresist|map_play_velocitypercent|heroic|extra_spirits|gustreduction|extra_skele_war|extra_skele_mage|extra_hydra|extra_valk|joustreduction|grims_extra_skele_mage|map_play_lightradius|blood_warp_life_reduction|map_glob_add_mon_souls|map_glob_add_mon_fetish|dclone_clout|maxlevel_clout|dev_clout|extra_skele_archer|extra_golem|inc_splash_radius|item_numsockets_textonly|rathma_clout|dragonflightreduction|item_dmgpercent_pereth|corpseexplosionradius|mirrored|item_dmgpercent_permissinghppercent|lifedrain_percentcap|inc_splash_radius_permissinghp|eaglehorn_raven|map_glob_skirmish_mode|map_mon_dropjewelry|map_mon_dropweapons|map_mon_droparmor|map_mon_dropcrafting|map_glob_extra_boss|map_glob_add_mon_shriek|map_force_event|deep_wounds|map_mon_dropcharms|map_glob_dropcorrupted|curse_effectiveness|map_glob_boss_dropfacet|map_mon_dropjewels|map_glob_sundermonsters|extra_grizzly|no_wolves) EOF;
percentage: PERCENTAGE;
exact_integer: PERCENTAGE;
WS : [ \t\r\n]+ -> skip;
SIGN: '-' | '+';
PERCENTAGE: SIGN?[0-9]+'%'?;