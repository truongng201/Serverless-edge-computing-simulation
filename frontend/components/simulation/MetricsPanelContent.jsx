import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Database, Timer, Users, Link, Server } from "lucide-react"

export default function MetricsPanelContent({
  users,
  edgeNodes,
  centralNodes,
  totalLatency,
  selectedUser,
  setSelectedUser,
  selectedEdge,
  setSelectedEdge,
  selectedCentral,
  setSelectedCentral,
  algorithms,
  selectedAlgorithm,
  rightPanelOpen,
  setRightPanelOpen,
}) {
  return (
    <>
      {/* System Metrics */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </span>
            <Badge variant="outline">{users.length}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Manual Connections
            </span>
            <Badge variant="outline">{users.filter((u) => u.manualConnection).length}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Edge Nodes
            </span>
            <Badge variant="outline">{edgeNodes.length}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Central Nodes
            </span>
            <Badge variant="outline">{centralNodes.length}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Avg Latency
            </span>
            <Badge variant={totalLatency > 50 ? "destructive" : totalLatency > 25 ? "secondary" : "default"}>
              {totalLatency}ms
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Network Load</span>
              <span>{Math.round(users.length * 8.33)}%</span>
            </div>
            <Progress value={Math.min(100, users.length * 8.33)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.slice(0, 8).map((user) => (
            <div
              key={user.id}
              className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                selectedUser && selectedUser.id === user.id ? "bg-purple-100" : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedUser(selectedUser && selectedUser.id === user.id ? null : user)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${user.manualConnection ? "bg-orange-500" : "bg-blue-500"}`}
                  />
                  {user.id}
                </span>
                <Badge variant={user.manualConnection ? "default" : "secondary"} className="text-xs">
                  {user.manualConnection ? "Manual" : "Auto"}
                </Badge>
              </div>
              <div className="text-gray-600">→ {user.assignedEdge || user.assignedCentral || "Disconnected"}</div>
            </div>
          ))}
          {users.length > 8 && (
            <div className="text-xs text-gray-500 text-center">... and {users.length - 8} more users</div>
          )}
        </CardContent>
      </Card>

      {/* Central Node Status */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Central Node Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {centralNodes.map((central) => (
            <div
              key={central.id}
              className={`p-2 rounded cursor-pointer transition-colors ${
                selectedCentral && selectedCentral.id === central.id ? "bg-blue-100" : "hover:bg-gray-50"
              }`}
              onClick={() =>
                setSelectedCentral(selectedCentral && selectedCentral.id === central.id ? null : central)
              }
            >
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {central.id}
                </span>
                <Badge
                  variant={
                    central.currentLoad > 80
                      ? "destructive"
                      : central.currentLoad > 50
                      ? "secondary"
                      : "default"
                  }
                  className="text-xs"
                >
                  {Math.round(central.currentLoad)}%
                </Badge>
              </div>
              <Progress value={central.currentLoad} className="h-1" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edge Node Status */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Edge Node Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {edgeNodes.map((edge) => (
            <div
              key={edge.id}
              className={`p-2 rounded cursor-pointer transition-colors ${
                selectedEdge && selectedEdge.id === edge.id ? "bg-green-100" : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedEdge(selectedEdge && selectedEdge.id === edge.id ? null : edge)}
            >
              <div className="flex justify-between text-xs mb-1">
                <span>{edge.id}</span>
                <Badge
                  variant={
                    edge.currentLoad > 80
                      ? "destructive"
                      : edge.currentLoad > 50
                      ? "secondary"
                      : "default"
                  }
                  className="text-xs"
                >
                  {Math.round(edge.currentLoad)}%
                </Badge>
              </div>
              <Progress value={edge.currentLoad} className="h-1" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Algorithm Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Current Algorithm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <div className="font-medium mb-2">{algorithms[selectedAlgorithm]}</div>
            <div className="text-xs text-gray-600">
              {selectedAlgorithm === "linear" && "Simple linear extrapolation based on current velocity"}
              {selectedAlgorithm === "kalman" && "Kalman filter with noise estimation for smooth prediction"}
              {selectedAlgorithm === "markov" && "Markov chain with state transition probabilities"}
              {selectedAlgorithm === "neural" && "Neural network-based prediction with weighted inputs"}
              {selectedAlgorithm === "gravity" && "Gravity model with attraction to edge and central nodes"}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
