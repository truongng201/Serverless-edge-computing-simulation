export function calculateDistance(point1X, point1Y, point2X, point2Y) {
    const dx = point2X - point1X;
    const dy = point2Y - point1Y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function findNearestNode(nodes, current_user) {
    if (!nodes || nodes.length === 0 || !current_user) {
        return null;
    }

    let nearestNode = nodes[0];
    let minDistance = calculateDistance(current_user.x, current_user.y, nearestNode.x, nearestNode.y);

    for(let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        const distance = calculateDistance(current_user.x, current_user.y, node.x, node.y);

        if (distance < minDistance) {
            minDistance = distance;
            nearestNode = node;
        }
    }

    return nearestNode;
}

export function getAllNodes(edgeNodes, centralNodes) {
    if (!edgeNodes && !centralNodes) {
        return [];
    }
    const allNodes = []
    for(let i = 0; i < edgeNodes.length; i++) {
        allNodes.push(edgeNodes[i]);
    }
    for(let i = 0; i < centralNodes.length; i++) {
        allNodes.push(centralNodes[i]);
    }
    return allNodes
}

export default {
    calculateDistance,
    findNearestNode,
    getAllNodes
}