'use strict'

class Graph {
  constructor () {
    this.nodes = new Map()
    this.parents = new Set()
  }

  edge (u, v) {
    this.inEdge(u, v)
  }

  node (u) {
    let res = this.nodes.get(u)
    if (res) {
      return res
    }
    res = {
      name: u,
      children: new Set(),
      parents: new Set()
    }
    this.parents.add(u)
    this.nodes.set(u, res)
    return res
  }

  inEdge (u, v) {
    this.node(u).children.add(v)
    this.node(v).parents.add(u)
    this.parents.delete(v)
  }

  top (cb) {
    const stack = []
    const map = new Map()
    this.nodes.forEach(node => {
      map.set(node.name, node.parents.size)
      if (node.parents.size === 0) {
        stack.push(node)
      }
    })
    let count = 0
    while (stack.length > 0) {
      count += 1
      const u = stack.pop()
      cb(u)
      u.children.forEach(id => {
        const rem = map.get(id) - 1
        if (rem > 0) {
          map.set(id, map.get(id) - 1)
        } else {
          stack.push(this.node(id))
        }
      })
    }
  }
}
