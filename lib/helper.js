export function calculateDistance(point1X, point1Y, point2X, point2Y) {
    const dx = point2X - point1X;
    const dy = point2Y - point1Y;
    return Math.sqrt(dx * dx + dy * dy);
}

export default {
    calculateDistance,
}