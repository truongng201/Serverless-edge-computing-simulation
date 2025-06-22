"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Play,
  Pause,
  RotateCcw,
  Users,
  Server,
  Settings,
  MapPin,
  Timer,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Database,
  Trash2,
  Link,
  Unlink,
  Edit3,
  Move,
} from "lucide-react"

export default function Component() {
  const canvasRef = useRef(null)
  const [users, setUsers] = useState([])
  const [edgeNodes, setEdgeNodes] = useState([
    { id: "edge-1", x: 200, y: 200, capacity: 100, currentLoad: 0, replicas: [], coverage: 120 },
    { id: "edge-2", x: 600, y: 200, capacity: 100, currentLoad: 0, replicas: [], coverage: 120 },
    { id: "edge-3", x: 400, y: 400, capacity: 100, currentLoad: 0, replicas: [], coverage: 120 },
    { id: "edge-4", x: 200, y: 600, capacity: 100, currentLoad: 0, replicas: [], coverage: 120 },
    { id: "edge-5", x: 600, y: 600, capacity: 100, currentLoad: 0, replicas: [], coverage: 120 },
  ])

  // Central nodes - main servers/coordinators
  const [centralNodes, setCentralNodes] = useState([
    { id: "central-1", x: 400, y: 300, capacity: 500, currentLoad: 0, coverage: 200, type: "main" },
  ])

  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState([1])
  const [predictionEnabled, setPredictionEnabled] = useState(true)
  const [totalLatency, setTotalLatency] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // UI State
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("linear")
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [selectedCentral, setSelectedCentral] = useState(null)

  // User settings
  const [userSpeed, setUserSpeed] = useState([2])
  const [userSize, setUserSize] = useState([8])
  const [predictionSteps, setPredictionSteps] = useState([10])

  // Edge settings
  const [edgeCapacity, setEdgeCapacity] = useState([100])
  const [edgeCoverage, setEdgeCoverage] = useState([120])

  // Central node settings
  const [centralCapacity, setCentralCapacity] = useState([500])
  const [centralCoverage, setCentralCoverage] = useState([200])

  // Zoom and Pan state
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })

  // Edit mode states
  const [editMode, setEditMode] = useState("none") // "none", "nodes", "users", "both"
  const [isDraggingNode, setIsDraggingNode] = useState(false)
  const [isDraggingUser, setIsDraggingUser] = useState(false)
  const [draggedNode, setDraggedNode] = useState(null)
  const [draggedUser, setDraggedUser] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Manual connection state
  const [manualConnectionMode, setManualConnectionMode] = useState(false)
  const [autoAssignment, setAutoAssignment] = useState(true)

  // Algorithms for user expectancy calculation
  const algorithms = {
    linear: "Linear Prediction",
    kalman: "Kalman Filter",
    markov: "Markov Chain",
    neural: "Neural Network",
    gravity: "Gravity Model",
  }

  // Calculate distance between two points
  const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  }

  // Find nearest edge node to a user
  const findNearestEdge = (user) => {
    if (edgeNodes.length === 0) return null
    return edgeNodes.reduce((nearest, edge) => {
      const distanceToEdge = calculateDistance(user.x, user.y, edge.x, edge.y)
      const distanceToNearest = calculateDistance(user.x, user.y, nearest.x, nearest.y)
      return distanceToEdge < distanceToNearest ? edge : nearest
    })
  }

  // Find nearest central node to a user
  const findNearestCentral = (user) => {
    if (centralNodes.length === 0) return null
    return centralNodes.reduce((nearest, central) => {
      const distanceToCentral = calculateDistance(user.x, user.y, central.x, central.y)
      const distanceToNearest = nearest
        ? calculateDistance(user.x, user.y, nearest.x, nearest.y)
        : Number.POSITIVE_INFINITY
      return distanceToCentral < distanceToNearest ? central : nearest
    })
  }

  // Get all available nodes for connection
  const getAllNodes = () => {
    return [
      ...edgeNodes.map((node) => ({ ...node, type: "edge" })),
      ...centralNodes.map((node) => ({ ...node, type: "central" })),
    ]
  }

  // Calculate latency based on connection
  const calculateLatency = (user, nodeId, nodeType) => {
    let targetNode = null
    if (nodeType === "edge") {
      targetNode = edgeNodes.find((edge) => edge.id === nodeId)
    } else if (nodeType === "central") {
      targetNode = centralNodes.find((central) => central.id === nodeId)
    }

    if (!targetNode) return 100 + Math.random() * 50

    const distance = calculateDistance(user.x, user.y, targetNode.x, targetNode.y)
    return Math.round(distance * 0.3 + Math.random() * 15)
  }

  // Manually connect user to a specific node
  const connectUserToNode = (userId, nodeId, nodeType) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.id === userId) {
          const latency = calculateLatency(user, nodeId, nodeType)
          return {
            ...user,
            assignedEdge: nodeType === "edge" ? nodeId : null,
            assignedCentral: nodeType === "central" ? nodeId : null,
            manualConnection: true,
            latency,
          }
        }
        return user
      }),
    )
  }

  // Disconnect user from all nodes
  const disconnectUser = (userId) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            assignedEdge: null,
            assignedCentral: null,
            manualConnection: false,
            latency: 100 + Math.random() * 50,
          }
        }
        return user
      }),
    )
  }

  // Reset all manual connections
  const resetAllConnections = () => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => ({
        ...user,
        manualConnection: false,
      })),
    )
  }

  // Update selected user properties
  const updateSelectedUser = (updates) => {
    if (!selectedUser) return
    setUsers((prevUsers) => prevUsers.map((user) => (user.id === selectedUser.id ? { ...user, ...updates } : user)))
    setSelectedUser((prev) => ({ ...prev, ...updates }))
  }

  // Delete selected user
  const deleteSelectedUser = () => {
    if (!selectedUser) return
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUser.id))
    setSelectedUser(null)
  }

  // Different prediction algorithms
  const predictUserMobility = (user) => {
    const predictions = []
    let currentX = user.x
    let currentY = user.y

    switch (selectedAlgorithm) {
      case "linear":
        for (let i = 1; i <= predictionSteps[0]; i++) {
          currentX += user.vx * i * 2
          currentY += user.vy * i * 2
          currentX = Math.max(10, Math.min(window.innerWidth - 10, currentX))
          currentY = Math.max(10, Math.min(window.innerHeight - 10, currentY))
          predictions.push({ x: currentX, y: currentY })
        }
        break

      case "kalman":
        const noise = 0.1
        for (let i = 1; i <= predictionSteps[0]; i++) {
          currentX += user.vx * i * 2 + (Math.random() - 0.5) * noise * i
          currentY += user.vy * i * 2 + (Math.random() - 0.5) * noise * i
          currentX = Math.max(10, Math.min(window.innerWidth - 10, currentX))
          currentY = Math.max(10, Math.min(window.innerHeight - 10, currentY))
          predictions.push({ x: currentX, y: currentY })
        }
        break

      case "markov":
        for (let i = 1; i <= predictionSteps[0]; i++) {
          const stateChange = Math.random()
          if (stateChange < 0.7) {
            currentX += user.vx * 2
            currentY += user.vy * 2
          } else {
            currentX += (Math.random() - 0.5) * 8
            currentY += (Math.random() - 0.5) * 8
          }
          currentX = Math.max(10, Math.min(window.innerWidth - 10, currentX))
          currentY = Math.max(10, Math.min(window.innerHeight - 10, currentY))
          predictions.push({ x: currentX, y: currentY })
        }
        break

      case "neural":
        for (let i = 1; i <= predictionSteps[0]; i++) {
          const weight1 = 0.8,
            weight2 = 0.6,
            bias = 0.1
          currentX += (user.vx * weight1 + user.vy * weight2 + bias) * 2
          currentY += (user.vy * weight1 + user.vx * weight2 + bias) * 2
          currentX = Math.max(10, Math.min(window.innerWidth - 10, currentX))
          currentY = Math.max(10, Math.min(window.innerHeight - 10, currentY))
          predictions.push({ x: currentX, y: currentY })
        }
        break

      case "gravity":
        for (let i = 1; i <= predictionSteps[0]; i++) {
          let forceX = 0,
            forceY = 0
          // Attraction to edge nodes
          edgeNodes.forEach((edge) => {
            const distance = calculateDistance(currentX, currentY, edge.x, edge.y)
            const force = 100 / (distance + 1)
            forceX += (edge.x - currentX) * force * 0.001
            forceY += (edge.y - currentY) * force * 0.001
          })
          // Stronger attraction to central nodes
          centralNodes.forEach((central) => {
            const distance = calculateDistance(currentX, currentY, central.x, central.y)
            const force = 200 / (distance + 1)
            forceX += (central.x - currentX) * force * 0.001
            forceY += (central.y - currentY) * force * 0.001
          })
          currentX += user.vx * 2 + forceX
          currentY += user.vy * 2 + forceY
          currentX = Math.max(10, Math.min(window.innerWidth - 10, currentX))
          currentY = Math.max(10, Math.min(window.innerHeight - 10, currentY))
          predictions.push({ x: currentX, y: currentY })
        }
        break

      default:
        return predictions
    }

    return predictions
  }

  // Optimize replica placement based on predictions
  const optimizeReplicaPlacement = useCallback(() => {
    if (!predictionEnabled) return

    const updatedUsers = users.map((user) => {
      const predictedPath = predictUserMobility(user)

      // Skip automatic assignment if user has manual connection
      if (user.manualConnection || !autoAssignment) {
        return {
          ...user,
          predictedPath,
        }
      }

      const nearestEdge = findNearestEdge(user)
      const nearestCentral = findNearestCentral(user)

      // Calculate latency considering both edge and central nodes
      let minDistance = Number.POSITIVE_INFINITY
      let assignedEdge = null
      let assignedCentral = null

      if (nearestEdge) {
        const edgeDistance = calculateDistance(user.x, user.y, nearestEdge.x, nearestEdge.y)
        if (edgeDistance < minDistance) {
          minDistance = edgeDistance
          assignedEdge = nearestEdge.id
          assignedCentral = null
        }
      }

      if (nearestCentral) {
        const centralDistance = calculateDistance(user.x, user.y, nearestCentral.x, nearestCentral.y)
        if (centralDistance < minDistance) {
          minDistance = centralDistance
          assignedEdge = null
          assignedCentral = nearestCentral.id
        }
      }

      // If no nodes available, set high latency
      const latency =
        minDistance === Number.POSITIVE_INFINITY
          ? 100 + Math.random() * 50
          : Math.round(minDistance * 0.3 + Math.random() * 15)

      return {
        ...user,
        predictedPath,
        assignedEdge,
        assignedCentral,
        latency,
      }
    })

    setUsers(updatedUsers)

    const avgLatency = updatedUsers.reduce((sum, user) => sum + user.latency, 0) / updatedUsers.length || 0
    setTotalLatency(Math.round(avgLatency))

    // Update edge node loads
    const updatedEdges = edgeNodes.map((edge) => {
      const assignedUsers = updatedUsers.filter((user) => user.assignedEdge === edge.id)
      const load = (assignedUsers.length / (edge.capacity / 10)) * 100
      return { ...edge, currentLoad: Math.min(100, load) }
    })
    setEdgeNodes(updatedEdges)

    // Update central node loads
    const updatedCentrals = centralNodes.map((central) => {
      const assignedUsers = updatedUsers.filter((user) => user.assignedCentral === central.id)
      const load = (assignedUsers.length / (central.capacity / 10)) * 100
      return { ...central, currentLoad: Math.min(100, load) }
    })
    setCentralNodes(updatedCentrals)
  }, [users, edgeNodes, centralNodes, predictionEnabled, selectedAlgorithm, predictionSteps, autoAssignment])

  // Simulation step
  const simulationStep = useCallback(() => {
    if (!isSimulating) return

    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        let newX = user.x + user.vx * simulationSpeed[0]
        let newY = user.y + user.vy * simulationSpeed[0]
        let newVx = user.vx
        let newVy = user.vy

        if (newX <= 10 || newX >= window.innerWidth - 10) {
          newVx = -newVx
          newX = Math.max(10, Math.min(window.innerWidth - 10, newX))
        }
        if (newY <= 10 || newY >= window.innerHeight - 10) {
          newVy = -newVy
          newY = Math.max(10, Math.min(window.innerHeight - 10, newY))
        }

        return { ...user, x: newX, y: newY, vx: newVx, vy: newVy }
      }),
    )
  }, [isSimulating, simulationSpeed])

  // Handle canvas click to add users or select nodes
  const handleCanvasClick = (event) => {
    if (isDragging || isPanning || isDraggingNode || isDraggingUser) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    const worldX = (screenX - panOffset.x) / zoomLevel
    const worldY = (screenY - panOffset.y) / zoomLevel

    // Check for node selection first
    const clickedEdge = edgeNodes.find((edge) => calculateDistance(worldX, worldY, edge.x, edge.y) < 20)
    const clickedCentral = centralNodes.find((central) => calculateDistance(worldX, worldY, central.x, central.y) < 25)
    const clickedUser = users.find((user) => calculateDistance(worldX, worldY, user.x, user.y) < user.size + 5)

    if (clickedEdge) {
      setSelectedEdge(clickedEdge)
      setSelectedCentral(null)
      setSelectedUser(null)
      return
    }

    if (clickedCentral) {
      setSelectedCentral(clickedCentral)
      setSelectedEdge(null)
      setSelectedUser(null)
      return
    }

    if (clickedUser) {
      setSelectedUser(clickedUser)
      setSelectedEdge(null)
      setSelectedCentral(null)
      return
    }

    // Clear selections and add user if not in edit mode
    setSelectedUser(null)
    setSelectedEdge(null)
    setSelectedCentral(null)

    if (editMode === "none") {
      const newUser = {
        id: `user-${Date.now()}`,
        x: worldX,
        y: worldY,
        vx: (Math.random() - 0.5) * userSpeed[0],
        vy: (Math.random() - 0.5) * userSpeed[0],
        predictedPath: [],
        assignedEdge: null,
        assignedCentral: null,
        latency: 0,
        size: userSize[0],
        manualConnection: false,
      }
      setUsers((prev) => [...prev, newUser])
    }
  }

  // Handle mouse down for dragging
  const handleMouseDown = (event) => {
    if (event.button === 1 || (event.button === 0 && event.ctrlKey && editMode === "none")) {
      setIsPanning(true)
      setLastPanPoint({ x: event.clientX, y: event.clientY })
      event.preventDefault()
      return
    }

    if (editMode !== "none") {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const screenX = event.clientX - rect.left
      const screenY = event.clientY - rect.top
      const worldX = (screenX - panOffset.x) / zoomLevel
      const worldY = (screenY - panOffset.y) / zoomLevel

      // Check for user dragging first (if users edit mode is enabled)
      if (editMode === "users" || editMode === "both") {
        const clickedUser = users.find((user) => calculateDistance(worldX, worldY, user.x, user.y) < user.size + 5)
        if (clickedUser) {
          setIsDraggingUser(true)
          setDraggedUser(clickedUser)
          setDragOffset({ x: worldX - clickedUser.x, y: worldY - clickedUser.y })
          event.preventDefault()
          return
        }
      }

      // Check for node dragging (if nodes edit mode is enabled)
      if (editMode === "nodes" || editMode === "both") {
        const clickedEdge = edgeNodes.find((edge) => calculateDistance(worldX, worldY, edge.x, edge.y) < 20)
        const clickedCentral = centralNodes.find(
          (central) => calculateDistance(worldX, worldY, central.x, central.y) < 25,
        )

        if (clickedEdge) {
          setIsDraggingNode(true)
          setDraggedNode({ type: "edge", node: clickedEdge })
          setDragOffset({ x: worldX - clickedEdge.x, y: worldY - clickedEdge.y })
          event.preventDefault()
          return
        }

        if (clickedCentral) {
          setIsDraggingNode(true)
          setDraggedNode({ type: "central", node: clickedCentral })
          setDragOffset({ x: worldX - clickedCentral.x, y: worldY - clickedCentral.y })
          event.preventDefault()
          return
        }
      }
    }

    setIsDragging(false)
    handleCanvasClick(event)
  }

  const handleMouseMove = (event) => {
    if (isPanning) {
      const deltaX = event.clientX - lastPanPoint.x
      const deltaY = event.clientY - lastPanPoint.y
      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }))
      setLastPanPoint({ x: event.clientX, y: event.clientY })
    } else if (isDraggingUser && draggedUser) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const screenX = event.clientX - rect.left
      const screenY = event.clientY - rect.top
      const worldX = (screenX - panOffset.x) / zoomLevel
      const worldY = (screenY - panOffset.y) / zoomLevel

      const newX = worldX - dragOffset.x
      const newY = worldY - dragOffset.y

      setUsers((prev) => prev.map((user) => (user.id === draggedUser.id ? { ...user, x: newX, y: newY } : user)))

      // Update selected user if it's the one being dragged
      if (selectedUser && selectedUser.id === draggedUser.id) {
        setSelectedUser((prev) => ({ ...prev, x: newX, y: newY }))
      }
    } else if (isDraggingNode && draggedNode) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const screenX = event.clientX - rect.left
      const screenY = event.clientY - rect.top
      const worldX = (screenX - panOffset.x) / zoomLevel
      const worldY = (screenY - panOffset.y) / zoomLevel

      const newX = worldX - dragOffset.x
      const newY = worldY - dragOffset.y

      if (draggedNode.type === "edge") {
        setEdgeNodes((prev) =>
          prev.map((edge) => (edge.id === draggedNode.node.id ? { ...edge, x: newX, y: newY } : edge)),
        )
      } else if (draggedNode.type === "central") {
        setCentralNodes((prev) =>
          prev.map((central) => (central.id === draggedNode.node.id ? { ...central, x: newX, y: newY } : central)),
        )
      }
    } else {
      setIsDragging(true)
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setIsDraggingNode(false)
    setIsDraggingUser(false)
    setDraggedNode(null)
    setDraggedUser(null)
    setTimeout(() => setIsDragging(false), 100)
  }

  // Zoom functions
  const zoomIn = () => setZoomLevel((prev) => Math.min(prev * 1.2, 5))
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev / 1.2, 0.2))
  const resetZoom = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleWheel = (event) => {
    event.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.2, Math.min(5, zoomLevel * zoomFactor))

    const zoomRatio = newZoom / zoomLevel
    const newPanX = mouseX - (mouseX - panOffset.x) * zoomRatio
    const newPanY = mouseY - (mouseY - panOffset.y) * zoomRatio

    setZoomLevel(newZoom)
    setPanOffset({ x: newPanX, y: newPanY })
  }

  // Drawing function with zoom and pan support
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(zoomLevel, zoomLevel)

    const visibleLeft = -panOffset.x / zoomLevel
    const visibleTop = -panOffset.y / zoomLevel
    const visibleRight = (canvas.width - panOffset.x) / zoomLevel
    const visibleBottom = (canvas.height - panOffset.y) / zoomLevel

    // Draw grid
    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = 1 / zoomLevel
    const gridSize = 50
    const startX = Math.floor(visibleLeft / gridSize) * gridSize
    const startY = Math.floor(visibleTop / gridSize) * gridSize

    for (let i = startX; i <= visibleRight + gridSize; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(i, visibleTop)
      ctx.lineTo(i, visibleBottom)
      ctx.stroke()
    }
    for (let i = startY; i <= visibleBottom + gridSize; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(visibleLeft, i)
      ctx.lineTo(visibleRight, i)
      ctx.stroke()
    }

    // Draw connections between central and edge nodes
    centralNodes.forEach((central) => {
      edgeNodes.forEach((edge) => {
        ctx.strokeStyle = "rgba(99, 102, 241, 0.2)"
        ctx.lineWidth = 2 / zoomLevel
        ctx.setLineDash([10 / zoomLevel, 5 / zoomLevel])
        ctx.beginPath()
        ctx.moveTo(central.x, central.y)
        ctx.lineTo(edge.x, edge.y)
        ctx.stroke()
        ctx.setLineDash([])
      })
    })

    // Draw central nodes
    centralNodes.forEach((central) => {
      if (
        central.x + central.coverage < visibleLeft ||
        central.x - central.coverage > visibleRight ||
        central.y + central.coverage < visibleTop ||
        central.y - central.coverage > visibleBottom
      ) {
        return
      }

      // Coverage area
      ctx.fillStyle = `rgba(99, 102, 241, ${0.03 + central.currentLoad * 0.002})`
      ctx.beginPath()
      ctx.arc(central.x, central.y, central.coverage, 0, 2 * Math.PI)
      ctx.fill()

      // Central node
      const isSelected = selectedCentral && selectedCentral.id === central.id
      ctx.fillStyle = isSelected
        ? "#8b5cf6"
        : central.currentLoad > 80
          ? "#dc2626"
          : central.currentLoad > 50
            ? "#ea580c"
            : "#6366f1"

      // Draw diamond shape for central nodes
      const size = isSelected ? 25 : 20
      ctx.beginPath()
      ctx.moveTo(central.x, central.y - size)
      ctx.lineTo(central.x + size, central.y)
      ctx.lineTo(central.x, central.y + size)
      ctx.lineTo(central.x - size, central.y)
      ctx.closePath()
      ctx.fill()

      // Edit mode indicator for nodes
      if ((editMode === "nodes" || editMode === "both") && !isSelected) {
        ctx.strokeStyle = "rgba(139, 92, 246, 0.5)"
        ctx.lineWidth = 2 / zoomLevel
        ctx.setLineDash([5 / zoomLevel, 5 / zoomLevel])
        ctx.beginPath()
        ctx.arc(central.x, central.y, 30, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = "#8b5cf6"
        ctx.lineWidth = 3 / zoomLevel
        ctx.beginPath()
        ctx.arc(central.x, central.y, 35, 0, 2 * Math.PI)
        ctx.stroke()
      }

      // Label
      const fontSize = Math.max(10, 14 / zoomLevel)
      ctx.fillStyle = "#374151"
      ctx.font = `${fontSize}px sans-serif`
      ctx.textAlign = "center"
      ctx.fillText(central.id, central.x, central.y - 45)
      ctx.fillText(`${Math.round(central.currentLoad)}%`, central.x, central.y + 55)
    })

    // Draw edge nodes
    edgeNodes.forEach((edge) => {
      if (
        edge.x + edge.coverage < visibleLeft ||
        edge.x - edge.coverage > visibleRight ||
        edge.y + edge.coverage < visibleTop ||
        edge.y - edge.coverage > visibleBottom
      ) {
        return
      }

      // Coverage area
      ctx.fillStyle = `rgba(59, 130, 246, ${0.05 + edge.currentLoad * 0.003})`
      ctx.beginPath()
      ctx.arc(edge.x, edge.y, edge.coverage, 0, 2 * Math.PI)
      ctx.fill()

      // Edge node
      const isSelected = selectedEdge && selectedEdge.id === edge.id
      ctx.fillStyle = isSelected
        ? "#8b5cf6"
        : edge.currentLoad > 80
          ? "#ef4444"
          : edge.currentLoad > 50
            ? "#f59e0b"
            : "#10b981"
      ctx.beginPath()
      ctx.arc(edge.x, edge.y, isSelected ? 20 : 15, 0, 2 * Math.PI)
      ctx.fill()

      // Edit mode indicator for nodes
      if ((editMode === "nodes" || editMode === "both") && !isSelected) {
        ctx.strokeStyle = "rgba(139, 92, 246, 0.5)"
        ctx.lineWidth = 2 / zoomLevel
        ctx.setLineDash([5 / zoomLevel, 5 / zoomLevel])
        ctx.beginPath()
        ctx.arc(edge.x, edge.y, 25, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = "#8b5cf6"
        ctx.lineWidth = 3 / zoomLevel
        ctx.beginPath()
        ctx.arc(edge.x, edge.y, 25, 0, 2 * Math.PI)
        ctx.stroke()
      }

      // Label
      const fontSize = Math.max(10, 14 / zoomLevel)
      ctx.fillStyle = "#374151"
      ctx.font = `${fontSize}px sans-serif`
      ctx.textAlign = "center"
      ctx.fillText(edge.id, edge.x, edge.y - 35)
      ctx.fillText(`${Math.round(edge.currentLoad)}%`, edge.x, edge.y + 45)
    })

    // Draw users and their predicted paths
    users.forEach((user) => {
      if (
        user.x < visibleLeft - 50 ||
        user.x > visibleRight + 50 ||
        user.y < visibleTop - 50 ||
        user.y > visibleBottom + 50
      ) {
        return
      }

      // Predicted path
      if (predictionEnabled && user.predictedPath.length > 0) {
        ctx.strokeStyle = "rgba(168, 85, 247, 0.6)"
        ctx.lineWidth = 2 / zoomLevel
        ctx.setLineDash([5 / zoomLevel, 5 / zoomLevel])
        ctx.beginPath()
        ctx.moveTo(user.x, user.y)
        user.predictedPath.forEach((point) => {
          ctx.lineTo(point.x, point.y)
        })
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Connection to assigned edge (different style for manual connections)
      if (user.assignedEdge) {
        const assignedEdge = edgeNodes.find((edge) => edge.id === user.assignedEdge)
        if (assignedEdge) {
          ctx.strokeStyle = user.manualConnection ? "rgba(34, 197, 94, 0.8)" : "rgba(34, 197, 94, 0.4)"
          ctx.lineWidth = user.manualConnection ? 2 / zoomLevel : 1 / zoomLevel
          if (user.manualConnection) {
            ctx.setLineDash([])
          }
          ctx.beginPath()
          ctx.moveTo(user.x, user.y)
          ctx.lineTo(assignedEdge.x, assignedEdge.y)
          ctx.stroke()
        }
      }

      // Connection to assigned central node (different style for manual connections)
      if (user.assignedCentral) {
        const assignedCentral = centralNodes.find((central) => central.id === user.assignedCentral)
        if (assignedCentral) {
          ctx.strokeStyle = user.manualConnection ? "rgba(99, 102, 241, 0.8)" : "rgba(99, 102, 241, 0.4)"
          ctx.lineWidth = user.manualConnection ? 2 / zoomLevel : 1 / zoomLevel
          if (user.manualConnection) {
            ctx.setLineDash([])
          }
          ctx.beginPath()
          ctx.moveTo(user.x, user.y)
          ctx.lineTo(assignedCentral.x, assignedCentral.y)
          ctx.stroke()
        }
      }

      // User
      const isSelected = selectedUser && selectedUser.id === user.id
      ctx.fillStyle = isSelected ? "#8b5cf6" : user.manualConnection ? "#f59e0b" : "#3b82f6"
      ctx.beginPath()
      ctx.arc(user.x, user.y, isSelected ? user.size + 2 : user.size, 0, 2 * Math.PI)
      ctx.fill()

      // Manual connection indicator
      if (user.manualConnection) {
        ctx.strokeStyle = "#f59e0b"
        ctx.lineWidth = 2 / zoomLevel
        ctx.beginPath()
        ctx.arc(user.x, user.y, user.size + 4, 0, 2 * Math.PI)
        ctx.stroke()
      }

      // Edit mode indicator for users
      if ((editMode === "users" || editMode === "both") && !isSelected) {
        ctx.strokeStyle = "rgba(139, 92, 246, 0.5)"
        ctx.lineWidth = 2 / zoomLevel
        ctx.setLineDash([3 / zoomLevel, 3 / zoomLevel])
        ctx.beginPath()
        ctx.arc(user.x, user.y, user.size + 8, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = "#8b5cf6"
        ctx.lineWidth = 2 / zoomLevel
        ctx.beginPath()
        ctx.arc(user.x, user.y, user.size + 6, 0, 2 * Math.PI)
        ctx.stroke()
      }

      // Latency indicator
      const latencyColor = user.latency > 50 ? "#ef4444" : user.latency > 25 ? "#f59e0b" : "#10b981"
      ctx.fillStyle = latencyColor
      ctx.beginPath()
      ctx.arc(user.x, user.y, 3, 0, 2 * Math.PI)
      ctx.fill()

      // User ID for selected user
      if (isSelected) {
        const fontSize = Math.max(8, 12 / zoomLevel)
        ctx.fillStyle = "#374151"
        ctx.font = `${fontSize}px sans-serif`
        ctx.textAlign = "center"
        ctx.fillText(user.id, user.x, user.y - user.size - 10)
      }
    })

    ctx.restore()
  }, [
    users,
    edgeNodes,
    centralNodes,
    predictionEnabled,
    selectedUser,
    selectedEdge,
    selectedCentral,
    zoomLevel,
    panOffset,
    editMode,
  ])

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      simulationStep()
      optimizeReplicaPlacement()
      draw()
    }, 100)

    return () => clearInterval(interval)
  }, [simulationStep, optimizeReplicaPlacement, draw])

  useEffect(() => {
    const handleResize = () => draw()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [draw])

  useEffect(() => {
    draw()
  }, [draw])

  const resetSimulation = () => {
    clearEverything()
  }

  const addEdgeNode = () => {
    const newEdge = {
      id: `edge-${edgeNodes.length + 1}`,
      x: Math.random() * (window.innerWidth - 200) + 100,
      y: Math.random() * (window.innerHeight - 200) + 100,
      capacity: edgeCapacity[0],
      currentLoad: 0,
      replicas: [],
      coverage: edgeCoverage[0],
    }
    setEdgeNodes((prev) => [...prev, newEdge])
  }

  const removeEdgeNode = () => {
    if (edgeNodes.length > 0) {
      const nodeToRemove = edgeNodes[edgeNodes.length - 1]
      setEdgeNodes((prev) => prev.slice(0, -1))
      if (selectedEdge && selectedEdge.id === nodeToRemove.id) {
        setSelectedEdge(null)
      }
    }
  }

  const addCentralNode = () => {
    const newCentral = {
      id: `central-${centralNodes.length + 1}`,
      x: Math.random() * (window.innerWidth - 400) + 200,
      y: Math.random() * (window.innerHeight - 400) + 200,
      capacity: centralCapacity[0],
      currentLoad: 0,
      coverage: centralCoverage[0],
      type: "main",
    }
    setCentralNodes((prev) => [...prev, newCentral])
  }

  const removeCentralNode = () => {
    if (centralNodes.length > 0) {
      setCentralNodes((prev) => prev.slice(0, -1))
      if (selectedCentral && selectedCentral.id === `central-${centralNodes.length}`) {
        setSelectedCentral(null)
      }
    }
  }

  const deleteSelectedNode = () => {
    if (selectedEdge) {
      setEdgeNodes((prev) => prev.filter((edge) => edge.id !== selectedEdge.id))
      setSelectedEdge(null)
    }
    if (selectedCentral) {
      setCentralNodes((prev) => prev.filter((central) => central.id !== selectedCentral.id))
      setSelectedCentral(null)
    }
  }

  const clearAllUsers = () => {
    setUsers([])
    setSelectedUser(null)
  }

  const clearAllEdgeNodes = () => {
    setEdgeNodes([])
    setSelectedEdge(null)
  }

  const clearAllCentralNodes = () => {
    setCentralNodes([])
    setSelectedCentral(null)
  }

  const clearEverything = () => {
    setUsers([])
    setEdgeNodes([])
    setCentralNodes([])
    setSelectedUser(null)
    setSelectedEdge(null)
    setSelectedCentral(null)
    setIsSimulating(false)
    setTotalLatency(0)
  }

  const getEditModeDescription = () => {
    switch (editMode) {
      case "nodes":
        return "Node Edit: Drag nodes to move • Click to select"
      case "users":
        return "User Edit: Drag users to move • Click to select"
      case "both":
        return "Full Edit: Drag nodes and users • Click to select"
      default:
        return "Click to add users • Mouse wheel to zoom • Ctrl+drag to pan"
    }
  }

  const getCursorStyle = () => {
    if (isPanning) return "grabbing"
    if (isDraggingNode || isDraggingUser) return "grabbing"
    if (editMode !== "none") return "move"
    return "crosshair"
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Full Screen Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 bg-white"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: getCursorStyle(),
        }}
      />

      {/* Left Control Panel */}
      <div
        className={`absolute left-0 top-0 h-full bg-white shadow-lg transition-transform duration-300 ${
          leftPanelOpen ? "translate-x-0" : "-translate-x-80"
        } w-80 z-10`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Control Panel</h2>
            <Button variant="ghost" size="sm" onClick={() => setLeftPanelOpen(!leftPanelOpen)}>
              {leftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          {/* Edit Mode Controls */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Edit Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Edit Mode</Label>
                <Select value={editMode} onValueChange={setEditMode}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None - Add Users</SelectItem>
                    <SelectItem value="nodes">Nodes Only</SelectItem>
                    <SelectItem value="users">Users Only</SelectItem>
                    <SelectItem value="both">Nodes & Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editMode !== "none" && (
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Drag to move elements</div>
                  <div>• Click to select elements</div>
                  <div>• Dashed rings show editable items</div>
                </div>
              )}

              {(selectedEdge || selectedCentral) && (
                <Button onClick={deleteSelectedNode} size="sm" variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected Node
                </Button>
              )}

              {selectedUser && (
                <Button onClick={deleteSelectedUser} size="sm" variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected User
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Manual Connection Controls */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link className="w-4 h-4" />
                Connection Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Auto Assignment</Label>
                <Switch checked={autoAssignment} onCheckedChange={setAutoAssignment} />
              </div>

              {selectedUser && (
                <div className="space-y-3">
                  <div className="p-2 bg-gray-50 rounded text-xs">
                    <div className="font-medium mb-1">Selected User: {selectedUser.id}</div>
                    <div>
                      Connected to:{" "}
                      {selectedUser.assignedEdge || selectedUser.assignedCentral || (
                        <span className="text-red-500">None</span>
                      )}
                    </div>
                    <div>
                      Connection:{" "}
                      <Badge variant={selectedUser.manualConnection ? "default" : "secondary"} className="text-xs">
                        {selectedUser.manualConnection ? "Manual" : "Auto"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Connect to Node:</Label>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        const [nodeType, nodeId] = value.split(":")
                        connectUserToNode(selectedUser.id, nodeId, nodeType)
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Choose node..." />
                      </SelectTrigger>
                      <SelectContent>
                        {edgeNodes.map((edge) => (
                          <SelectItem key={`edge:${edge.id}`} value={`edge:${edge.id}`}>
                            🟢 {edge.id} (Load: {Math.round(edge.currentLoad)}%)
                          </SelectItem>
                        ))}
                        {centralNodes.map((central) => (
                          <SelectItem key={`central:${central.id}`} value={`central:${central.id}`}>
                            💎 {central.id} (Load: {Math.round(central.currentLoad)}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => disconnectUser(selectedUser.id)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Unlink className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}

              <Button onClick={resetAllConnections} size="sm" variant="outline" className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All Connections
              </Button>
            </CardContent>
          </Card>

          {/* User Editor */}
          {selectedUser && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Move className="w-4 h-4" />
                  User Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <div className="font-medium mb-2">Editing: {selectedUser.id}</div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label className="text-xs">X Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedUser.x)}
                        onChange={(e) => updateSelectedUser({ x: Number.parseFloat(e.target.value) || 0 })}
                        className="h-6 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedUser.y)}
                        onChange={(e) => updateSelectedUser({ y: Number.parseFloat(e.target.value) || 0 })}
                        className="h-6 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label className="text-xs">X Velocity</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={selectedUser.vx.toFixed(1)}
                        onChange={(e) => updateSelectedUser({ vx: Number.parseFloat(e.target.value) || 0 })}
                        className="h-6 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y Velocity</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={selectedUser.vy.toFixed(1)}
                        onChange={(e) => updateSelectedUser({ vy: Number.parseFloat(e.target.value) || 0 })}
                        className="h-6 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Size: {selectedUser.size}px</Label>
                    <Slider
                      value={[selectedUser.size]}
                      onValueChange={([value]) => updateSelectedUser({ size: value })}
                      max={20}
                      min={5}
                      step={1}
                      className="h-4"
                    />
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    <div>Latency: {selectedUser.latency}ms</div>
                    <div>Edge: {selectedUser.assignedEdge || "None"}</div>
                    <div>Central: {selectedUser.assignedCentral || "None"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clear All Controls */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Clear Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={clearAllUsers} size="sm" variant="outline">
                  <Users className="w-4 h-4 mr-1" />
                  Users
                </Button>
                <Button onClick={clearAllEdgeNodes} size="sm" variant="outline">
                  <Server className="w-4 h-4 mr-1" />
                  Edges
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={clearAllCentralNodes} size="sm" variant="outline">
                  <Database className="w-4 h-4 mr-1" />
                  Central
                </Button>
                <Button onClick={clearEverything} size="sm" variant="destructive">
                  <Trash2 className="w-4 h-4 mr-1" />
                  All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Simulation Controls */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsSimulating(!isSimulating)}
                  variant={isSimulating ? "destructive" : "default"}
                  size="sm"
                  className="flex-1"
                >
                  {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isSimulating ? "Pause" : "Start"}
                </Button>
                <Button onClick={resetSimulation} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Speed: {simulationSpeed[0]}x</Label>
                <Slider value={simulationSpeed} onValueChange={setSimulationSpeed} max={5} min={0.1} step={0.1} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Prediction</Label>
                <Switch checked={predictionEnabled} onCheckedChange={setPredictionEnabled} />
              </div>
            </CardContent>
          </Card>

          {/* Zoom Controls */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Zoom & Pan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={zoomIn} size="sm" variant="outline" className="flex-1">
                  <Plus className="w-4 h-4" />
                  Zoom In
                </Button>
                <Button onClick={zoomOut} size="sm" variant="outline" className="flex-1">
                  <Minus className="w-4 h-4" />
                  Zoom Out
                </Button>
              </div>

              <Button onClick={resetZoom} size="sm" variant="outline" className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset View
              </Button>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Zoom Level</span>
                  <span>{(zoomLevel * 100).toFixed(0)}%</span>
                </div>
                <Progress value={((zoomLevel - 0.2) / (5 - 0.2)) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Algorithm Selection */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Algorithm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Prediction Algorithm</Label>
                <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(algorithms).map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Prediction Steps: {predictionSteps[0]}</Label>
                <Slider value={predictionSteps} onValueChange={setPredictionSteps} max={20} min={5} step={1} />
              </div>
            </CardContent>
          </Card>

          {/* User Settings */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">User Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Speed: {userSpeed[0]}</Label>
                <Slider value={userSpeed} onValueChange={setUserSpeed} max={10} min={0.5} step={0.5} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Size: {userSize[0]}px</Label>
                <Slider value={userSize} onValueChange={setUserSize} max={15} min={5} step={1} />
              </div>
            </CardContent>
          </Card>

          {/* Central Node Settings */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Central Nodes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={addCentralNode} size="sm" variant="outline" className="flex-1">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
                <Button onClick={removeCentralNode} size="sm" variant="outline" className="flex-1">
                  <Minus className="w-4 h-4" />
                  Remove
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Capacity: {centralCapacity[0]}</Label>
                <Slider value={centralCapacity} onValueChange={setCentralCapacity} max={1000} min={200} step={50} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Coverage: {centralCoverage[0]}px</Label>
                <Slider value={centralCoverage} onValueChange={setCentralCoverage} max={300} min={100} step={20} />
              </div>

              {selectedCentral && (
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <div>Selected: {selectedCentral.id}</div>
                  <div>
                    Position: ({Math.round(selectedCentral.x)}, {Math.round(selectedCentral.y)})
                  </div>
                  <div>Capacity: {selectedCentral.capacity}</div>
                  <div>Load: {Math.round(selectedCentral.currentLoad)}%</div>
                  <div>Coverage: {selectedCentral.coverage}px</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edge Node Settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Edge Nodes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={addEdgeNode} size="sm" variant="outline" className="flex-1">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
                <Button onClick={removeEdgeNode} size="sm" variant="outline" className="flex-1">
                  <Minus className="w-4 h-4" />
                  Remove
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Capacity: {edgeCapacity[0]}</Label>
                <Slider value={edgeCapacity} onValueChange={setEdgeCapacity} max={200} min={50} step={10} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Coverage: {edgeCoverage[0]}px</Label>
                <Slider value={edgeCoverage} onValueChange={setEdgeCoverage} max={200} min={50} step={10} />
              </div>

              {selectedEdge && (
                <div className="p-2 bg-green-50 rounded text-xs">
                  <div>Selected: {selectedEdge.id}</div>
                  <div>
                    Position: ({Math.round(selectedEdge.x)}, {Math.round(selectedEdge.y)})
                  </div>
                  <div>Capacity: {selectedEdge.capacity}</div>
                  <div>Load: {Math.round(selectedEdge.currentLoad)}%</div>
                  <div>Coverage: {selectedEdge.coverage}px</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Metrics Panel */}
      <div
        className={`absolute right-0 top-0 h-full bg-white shadow-lg transition-transform duration-300 ${
          rightPanelOpen ? "translate-x-0" : "translate-x-80"
        } w-80 z-10`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Metrics</h2>
            <Button variant="ghost" size="sm" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
              {rightPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>

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
                        central.currentLoad > 80 ? "destructive" : central.currentLoad > 50 ? "secondary" : "default"
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
                      variant={edge.currentLoad > 80 ? "destructive" : edge.currentLoad > 50 ? "secondary" : "default"}
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
        </div>
      </div>

      {/* Toggle Buttons for Panels */}
      {!leftPanelOpen && (
        <Button className="absolute left-4 top-4 z-20" size="sm" onClick={() => setLeftPanelOpen(true)}>
          <Settings className="w-4 h-4" />
        </Button>
      )}

      {!rightPanelOpen && (
        <Button className="absolute right-4 top-4 z-20" size="sm" onClick={() => setRightPanelOpen(true)}>
          <MapPin className="w-4 h-4" />
        </Button>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm z-20">
        {getEditModeDescription()}
      </div>
    </div>
  )
}
