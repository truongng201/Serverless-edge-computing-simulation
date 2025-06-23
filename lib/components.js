class Node {
    constructor(id, x, y, capacity, currentLoad, coverage) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.capacity = capacity; 
        this.currentLoad = currentLoad;
        this.coverage = coverage; 
    }
    
}

export class EdgeNode extends Node {
    constructor(id, x, y, capacity, coverage, replicas = []) {
        super(id, x, y, capacity, 0, coverage);
        this.replicas = replicas;
        this.type = 'edge';
    }
}

export class CentralNode extends Node {
    constructor(id, x, y, capacity, coverage) {
        super(id, x, y, capacity, 0, coverage);
        this.type = 'central';
    }
}

export class UserNode extends Node {
    constructor(id, x, y, capacity, coverage) {
        super(id, x, y, capacity, 0, coverage);
        this.type = 'user';
    }
}

export default {
    EdgeNode,
    CentralNode,
    UserNode
}