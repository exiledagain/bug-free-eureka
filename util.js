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
    console.log(this.parents)
  }
}
