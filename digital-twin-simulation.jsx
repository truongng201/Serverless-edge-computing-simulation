"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Settings } from "lucide-react";
import ControlPanel from "@/components/simulation/ControlPanel";
import MetricsPanel from "@/components/simulation/MetricsPanel";
import SimulationCanvas from "@/components/simulation/SimulationCanvas";
import EditModeDescription from "@/components/simulation/EditModeDescription";
import ControlPanelContent from "@/components/simulation/ControlPanelContent";
import MetricsPanelContent from "@/components/simulation/MetricsPanelContent";
import { calculateDistance, findNearestNode, getAllNodes } from "@/lib/helper";
import { CentralNode, EdgeNode, UserNode } from "./lib/components";
import { createLSTMPredictor } from "../ml_model/index.js";

export default function Component() {
  const canvasRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [edgeNodes, setEdgeNodes] = useState([]);

  // Central nodes - main servers/coordinators
  const [centralNodes, setCentralNodes] = useState([]);
  const [graph, setGraph] = useState(new Map()); // adjacency list for graph representation

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState([1]);
  const [predictionEnabled, setPredictionEnabled] = useState(true);
  const [totalLatency, setTotalLatency] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // UI State
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("gdy");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedCentral, setSelectedCentral] = useState(null);

  // User settings
  const [userSpeed, setUserSpeed] = useState([2]);
  const [userSize, setUserSize] = useState([8]);
  const [predictionSteps, setPredictionSteps] = useState([10]);

  // Edge settings
  const [edgeCapacity, setEdgeCapacity] = useState([100]);
  const [edgeCoverage, setEdgeCoverage] = useState([0]);

  // Central node settings
  const [centralCapacity, setCentralCapacity] = useState([500]);
  const [centralCoverage, setCentralCoverage] = useState([0]);

  // Zoom and Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Edit mode states
  const [editMode, setEditMode] = useState("none"); // "none", "nodes", "users", "both"
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isDraggingUser, setIsDraggingUser] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [draggedUser, setDraggedUser] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Manual connection state
  const [manualConnectionMode, setManualConnectionMode] = useState(false);
  const [autoAssignment, setAutoAssignment] = useState(true);

  // FIXED VALUES for stability (Option 1 + 2)
  const FIXED_DATA_SIZE = 300; // Fixed 300MB for all users
  const FIXED_CONTAINER_MEMORY = 1000; // Fixed 1GB for all users

  // DACT DATASET INTEGRATION
  const [dactTrajectories, setDactTrajectories] = useState([]);
  const [currentTimeStep, setCurrentTimeStep] = useState(0);
  const [maxTimeSteps, setMaxTimeSteps] = useState(0);
  const [trajectoryMode, setTrajectoryMode] = useState(false); // false = random, true = DACT

  // LSTM PREDICTOR INTEGRATION
  const [lstmPredictor, setLstmPredictor] = useState(null);
  const [isLSTMInitialized, setIsLSTMInitialized] = useState(false);
  const [isLSTMTrained, setIsLSTMTrained] = useState(false);
  const [lstmTrainingProgress, setLstmTrainingProgress] = useState(null);

  // Initialize LSTM Predictor
  const initializeLSTM = async (aggregationType = "easy") => {
    try {
      console.log('🚀 Initializing LSTM Predictor...');
      
      const predictor = createLSTMPredictor({
        aggregationType: aggregationType,
        csvFilePath: `/DACT ${aggregationType === 'easy' ? 'Easy' : 'Strict'}-Dataset.csv`,
        autoTrain: true, // Auto-train after loading data
        modelConfig: {
          sequenceLength: 10,
          hiddenUnits: 64,
          lstmLayers: 2,
          epochs: 50,
          batchSize: 32
        }
      });

      // Try to load pre-trained model first
      const hasPretrainedModel = await predictor.loadPretrainedModel();
      
      if (!hasPretrainedModel) {
        // Initialize and train if no pre-trained model
        const initResult = await predictor.initialize();
        console.log('📊 LSTM Initialization Result:', initResult);
        setIsLSTMTrained(predictor.isTrained);
      } else {
        // Load data without training
        await predictor.initialize();
        setIsLSTMTrained(true);
      }

      setLstmPredictor(predictor);
      setIsLSTMInitialized(true);
      
      // Load DACT users into simulation
      const dactUsers = predictor.getDACTUsers();
      console.log(`👥 Loaded ${dactUsers.length} DACT users`);
      
      return predictor;

    } catch (error) {
      console.error('❌ Error initializing LSTM:', error);
      return null;
    }
  };

  // Load DACT dataset (to be implemented)
  const loadDACTDataset = async (aggregationType = "easy") => {
    try {
      // TODO: Load CSV file based on aggregationType
      console.log(`Loading DACT ${aggregationType} aggregation dataset...`);
      // For now, return empty array - will implement file loading
      return [];
    } catch (error) {
      console.error("Error loading DACT dataset:", error);
      return [];
    }
  };

  // Convert DACT coordinates to simulation canvas
  const convertDACTToCanvas = (latitude, longitude, bounds) => {
    const { minLat, maxLat, minLong, maxLong } = bounds;
    const x = ((longitude - minLong) / (maxLong - minLong)) * (window.innerWidth - 100) + 50;
    const y = ((latitude - minLat) / (maxLat - minLat)) * (window.innerHeight - 100) + 50;
    return { x: Math.max(50, Math.min(window.innerWidth - 50, x)), 
             y: Math.max(50, Math.min(window.innerHeight - 50, y)) };
  };

  // Convert car speed to mobile user speed (mph to pixels/frame)
  const convertSpeedToMobile = (carSpeedMph) => {
    // Car: 30mph average -> Mobile: 3mph walking speed
    const mobileSpeedMph = carSpeedMph * 0.1; // 10% of car speed
    const pixelsPerFrame = (mobileSpeedMph * 1.467) / 10; // mph to pixels/frame at 10fps
    return Math.max(0.5, Math.min(5, pixelsPerFrame)); // Cap between 0.5-5 pixels/frame
  };

  // Helper function to ensure all users have fixed values
  const ensureUserFixedValues = (user) => {
    return {
      ...user,
      fixedDataSize: user.fixedDataSize || FIXED_DATA_SIZE,
      fixedContainerMemory: user.fixedContainerMemory || FIXED_CONTAINER_MEMORY
    };
  };

  // Algorithms for user assignment prediction
  const algorithms = {
    gdy: "GDY (Greedy Assignment)",
    "lstm-gdy": "LSTM-Enhanced GDY",
    lstm: "LSTM Position Prediction",
    // TODO: Add more assignment algorithms here
    placeholder: "No Algorithm Selected",
  };

  // Calculate distance between two points
  const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  // Find nearest edge node to a user
  const findNearestEdge = (user) => {
    if (edgeNodes.length === 0) return null;
    return edgeNodes.reduce((nearest, edge) => {
      const distanceToEdge = calculateDistance(user.x, user.y, edge.x, edge.y);
      const distanceToNearest = calculateDistance(
        user.x,
        user.y,
        nearest.x,
        nearest.y
      );
      return distanceToEdge < distanceToNearest ? edge : nearest;
    });
  };

  // Find nearest central node to a user
  const findNearestCentral = (user) => {
    if (centralNodes.length === 0) return null;
    return centralNodes.reduce((nearest, central) => {
      const distanceToCentral = calculateDistance(
        user.x,
        user.y,
        central.x,
        central.y
      );
      const distanceToNearest = nearest
        ? calculateDistance(user.x, user.y, nearest.x, nearest.y)
        : Number.POSITIVE_INFINITY;
      return distanceToCentral < distanceToNearest ? central : nearest;
    });
  };

  // Get all available nodes for connection
  const getAllNodes = () => {
    return [
      ...edgeNodes.map((node) => ({ ...node, type: "edge" })),
      ...centralNodes.map((node) => ({ ...node, type: "central" })),
    ];
  };

  // Calculate latency based on connection using experimental formula
  const calculateLatency = (user, nodeId, nodeType) => {
    let targetNode = null;
    if (nodeType === "edge") {
      targetNode = edgeNodes.find((edge) => edge.id === nodeId);
    } else if (nodeType === "central") {
      targetNode = centralNodes.find((central) => central.id === nodeId);
    }

    if (!targetNode) return 120; // FIXED fallback latency

    // STABLE - Use user's fixed data size (Option 1 + 2)
    const dataSize = user.fixedDataSize || FIXED_DATA_SIZE;
    
    // Calculate PHYSICAL DISTANCE between user and target node
    const physicalDistance = calculateDistance(user.x, user.y, targetNode.x, targetNode.y);
    
    // Determine if it's Cold Start or Warm Start
    const isWarmStart = targetNode.isWarm || false; // I_{u,v,t}
    const coldStartIndicator = isWarmStart ? 1 : 0;
    
    // Calculate Communication Delay: d_com = distance × baseRate × dataSize
    let baseTransmissionRate; // Base rate per pixel distance (ms/MB/pixel)
    if (nodeType === "edge") {
      // Edge nodes: Lower base rate (shorter network path)
      baseTransmissionRate = 0.002; // 0.002 ms/MB/pixel
    } else {
      // Central nodes: Higher base rate (longer network path to cloud)
      baseTransmissionRate = 0.008; // 0.008 ms/MB/pixel (4x higher)
    }
    
    // Total transmission delay = distance × baseRate × dataSize
    const communicationDelay = physicalDistance * baseTransmissionRate * dataSize;
    
    // Calculate Processing Delay: d_proc = (1 - I_{u,v,t}) × d_cold + s(u,t) × ρ_{u,v}
    
    // FIXED cold start delay (independent of distance)
    const coldStartDelay = 200; // Fixed 200ms cold start penalty
    
    // Unit processing time ρ_{u,v} (ms/MB) - MAXIMUM PROCESSING SPEEDS
    let unitProcessingTime;
    if (nodeType === "edge") {
      // Edge: Maximum speed in range (0.5-2 MB/ms)
      unitProcessingTime = 0.5; // 0.5 ms/MB → 2 MB/ms (MAXIMUM)
    } else {
      // Central: Remote cloud maximum speed
      unitProcessingTime = 0.05; // 0.05 ms/MB → 20 MB/ms (MAXIMUM)
    }
    
    const processingDelay = (1 - coldStartIndicator) * coldStartDelay + dataSize * unitProcessingTime;
    
    // Total Service Delay: D(u,v,t) = d_com + d_proc
    const totalLatency = communicationDelay + processingDelay;
    
    // Mark node as warm for next requests (simulating container reuse)
    if (targetNode) {
      targetNode.isWarm = true;
      targetNode.lastAccessTime = Date.now();
    }
    
    // Store additional metrics for debugging/display
    if (targetNode) {
      targetNode.lastMetrics = {
        dataSize: Math.round(dataSize),
        physicalDistance: Math.round(physicalDistance),
        communicationDelay: Math.round(communicationDelay),
        processingDelay: Math.round(processingDelay),
        isWarmStart: isWarmStart,
        baseTransmissionRate: baseTransmissionRate.toFixed(3),
        unitProcessingTime: unitProcessingTime.toFixed(2)
      };
    }
    
    return Math.round(totalLatency);
  };

  // Manually connect user to a specific node
  const connectUserToNode = (userId, nodeId, nodeType) => {
    const allNodes = getAllNodes(edgeNodes, centralNodes);
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user.id === userId) {
          // ENSURE USER HAS FIXED VALUES before calculation
          const userWithFixedValues = ensureUserFixedValues(user);
          const latency = calculateLatency(userWithFixedValues, nodeId, allNodes);
          return {
            ...userWithFixedValues,
            assignedEdge: nodeType === "edge" ? nodeId : null,
            assignedCentral: nodeType === "central" ? nodeId : null,
            manualConnection: true,
            latency,
          };
        }
        return ensureUserFixedValues(user); // Ensure all users get fixed values
      })
    );
  };

  // Disconnect user from all nodes
  const disconnectUser = (userId) => {
    setUsers((prevUsers) => {
      const newUsers = [];
      for (let i = 0; i < prevUsers.length; i++) {
        const user = prevUsers[i];
        if (user.id === userId) {
          // ENSURE FIXED VALUES before memory cleanup
          const userWithFixedValues = ensureUserFixedValues(user);
          
          // MEMORY CLEANUP: Deallocate memory from cloudlet if assigned
          if (userWithFixedValues.assignedEdge && userWithFixedValues.assignmentInfo) {
            const targetCloudlet = edgeNodes.find(edge => edge.id === userWithFixedValues.assignedEdge);
            if (targetCloudlet && userWithFixedValues.assignmentInfo.requiredMemory) {
              targetCloudlet.usedMemory = Math.max(0, targetCloudlet.usedMemory - userWithFixedValues.assignmentInfo.requiredMemory);
            }
          }
          
          newUsers.push({
            ...userWithFixedValues,
            assignedEdge: null,
            assignedCentral: null,
            manualConnection: false,
            latency: 500, // FIXED high latency when disconnected
            assignmentInfo: null // Clear assignment info
          });
        } else {
          newUsers.push(ensureUserFixedValues(user));
        }
      }
      return newUsers;
    });
  };

  // Reset all manual connections
  const resetAllConnections = () => {
    setUsers((prevUsers) => {
      const newUsers = [];
      for (let i = 0; i < prevUsers.length; i++) {
        newUsers.push({ ...prevUsers[i], manualConnection: false });
      }
      return newUsers;
    });
  };

  // Update selected user properties
  const updateSelectedUser = (updates) => {
    if (!selectedUser) return;
    setUsers((prevUsers) => {
      const newUsers = [];
      for (let i = 0; i < prevUsers.length; i++) {
        const user = prevUsers[i];
        if (user.id === selectedUser.id) {
          // ENSURE FIXED VALUES are preserved during updates
          const userWithFixedValues = ensureUserFixedValues(user);
          newUsers.push({ ...userWithFixedValues, ...updates });
        } else {
          newUsers.push(ensureUserFixedValues(user));
        }
      }
      return newUsers;
    });
    setSelectedUser((prev) => ({ ...ensureUserFixedValues(prev), ...updates }));
  };

  // Delete selected user
  const deleteSelectedUser = () => {
    if (!selectedUser) return;
    
    // MEMORY CLEANUP: Deallocate memory before deletion
    if (selectedUser.assignedEdge && selectedUser.assignmentInfo) {
      const targetCloudlet = edgeNodes.find(edge => edge.id === selectedUser.assignedEdge);
      if (targetCloudlet && selectedUser.assignmentInfo.requiredMemory) {
        targetCloudlet.usedMemory = Math.max(0, targetCloudlet.usedMemory - selectedUser.assignmentInfo.requiredMemory);
      }
    }
    
    setUsers((prevUsers) => {
      const newUsers = [];
      for (let i = 0; i < prevUsers.length; i++) {
        if (prevUsers[i].id !== selectedUser.id) {
          newUsers.push(prevUsers[i]);
        }
      }
      return newUsers;
    });
    setSelectedUser(null);
  };

  // ========================================
  // ASSIGNMENT PREDICTION ALGORITHMS
  // ========================================
  const predictUserAssignment = (user) => {
    // STABLE - Use user's fixed container memory (Option 1 + 2)
    const requiredMemory = user.fixedContainerMemory || FIXED_CONTAINER_MEMORY;

    switch (selectedAlgorithm) {
      case "gdy":
        return greedyAssignment(user, requiredMemory);

      case "lstm-gdy":
        return lstmEnhancedGDY(user, requiredMemory);

      case "lstm":
        return lstmPredictionAssignment(user, requiredMemory);
        
      // TODO: Add more assignment algorithms here
      
      default:
        // No algorithm selected - return null assignment
        return {
          assignedNode: null,
          nodeType: null,
          utility: 0,
          reason: "no_algorithm_selected",
          requiredMemory: requiredMemory
        };
    }
  };

  // LSTM-Enhanced GDY Assignment Algorithm
  const lstmEnhancedGDY = (user, requiredMemory) => {
    if (!isLSTMInitialized || !lstmPredictor) {
      console.warn('⚠️ LSTM not initialized, falling back to standard GDY');
      return greedyAssignment(user, requiredMemory);
    }

    try {
      // Get LSTM prediction for user's next position
      const lstmPrediction = lstmPredictor.predictUserPosition(user.id);
      
      if (!lstmPrediction) {
        console.warn(`⚠️ No LSTM prediction for user ${user.id}, using standard GDY`);
        return greedyAssignment(user, requiredMemory);
      }

      // Use predicted position for assignment decision
      const predictedUser = {
        ...user,
        x: lstmPrediction.canvas.x,
        y: lstmPrediction.canvas.y,
        id: user.id + '_predicted'
      };

      // Calculate utility based on predicted position
      const remoteClouds = centralNodes.filter(node => node.nodeType === "cloud");
      if (remoteClouds.length === 0) {
        return {
          assignedNode: null,
          nodeType: null,
          utility: 0,
          reason: "no_remote_cloud_available",
          requiredMemory: requiredMemory,
          prediction: lstmPrediction
        };
      }

      const remoteCloud = remoteClouds[0];
      const remoteCloudLatency = calculateLatency(predictedUser, remoteCloud.id, "central");

      // Find best cloudlet based on predicted position
      let bestCloudlet = null;
      let maxUtility = 0;
      let bestUtilityInfo = null;

      edgeNodes.forEach(cloudlet => {
        const availableMemory = cloudlet.totalMemory - cloudlet.usedMemory;
        
        if (availableMemory >= requiredMemory) {
          const cloudletLatency = calculateLatency(predictedUser, cloudlet.id, "edge");
          
          // Enhanced utility with LSTM confidence weighting
          const baseUtility = remoteCloudLatency - cloudletLatency;
          const confidenceWeight = lstmPrediction.confidence || 0.5;
          const enhancedUtility = baseUtility * confidenceWeight;
          
          // Segment-aware utility adjustment
          const segmentModifier = getSegmentUtilityModifier(lstmPrediction.segmentType);
          const finalUtility = enhancedUtility * segmentModifier;

          if (finalUtility > maxUtility) {
            maxUtility = finalUtility;
            bestCloudlet = cloudlet;
            bestUtilityInfo = {
              cloudletLatency: cloudletLatency,
              remoteLatency: remoteCloudLatency,
              availableMemory: availableMemory,
              confidence: confidenceWeight,
              segmentType: lstmPrediction.segmentType,
              segmentModifier: segmentModifier
            };
          }
        }
      });

      // Make assignment decision
      if (bestCloudlet && maxUtility > 0) {
        return {
          assignedNode: bestCloudlet.id,
          nodeType: "edge",
          utility: maxUtility,
          reason: "lstm_enhanced_utility_maximized",
          requiredMemory: requiredMemory,
          prediction: lstmPrediction,
          debugInfo: bestUtilityInfo
        };
      } else {
        return {
          assignedNode: remoteCloud.id,
          nodeType: "central",
          utility: 0,
          reason: bestCloudlet ? "no_enhanced_utility_gain" : "memory_constraint",
          requiredMemory: requiredMemory,
          prediction: lstmPrediction,
          debugInfo: {
            remoteLatency: remoteCloudLatency,
            checkedCloudlets: edgeNodes.length
          }
        };
      }

    } catch (error) {
      console.error('❌ Error in LSTM-Enhanced GDY:', error);
      return greedyAssignment(user, requiredMemory);
    }
  };

  // Pure LSTM Prediction Assignment
  const lstmPredictionAssignment = (user, requiredMemory) => {
    if (!isLSTMInitialized || !lstmPredictor) {
      return {
        assignedNode: null,
        nodeType: null,
        utility: 0,
        reason: "lstm_not_initialized",
        requiredMemory: requiredMemory
      };
    }

    try {
      // Get multi-step LSTM prediction
      const trajectoryPrediction = lstmPredictor.predictUserTrajectory(user.id, 5);
      
      if (!trajectoryPrediction || trajectoryPrediction.length === 0) {
        return {
          assignedNode: null,
          nodeType: null,
          utility: 0,
          reason: "no_lstm_trajectory_prediction",
          requiredMemory: requiredMemory
        };
      }

      // Analyze predicted trajectory to find optimal assignment
      const trajectoryAnalysis = analyzeTrajectoryForAssignment(trajectoryPrediction, requiredMemory);

      return {
        assignedNode: trajectoryAnalysis.bestNode?.id || null,
        nodeType: trajectoryAnalysis.bestNodeType || null,
        utility: trajectoryAnalysis.maxUtility || 0,
        reason: "lstm_trajectory_analysis",
        requiredMemory: requiredMemory,
        trajectoryPrediction: trajectoryPrediction,
        analysis: trajectoryAnalysis
      };

    } catch (error) {
      console.error('❌ Error in LSTM Prediction Assignment:', error);
      return {
        assignedNode: null,
        nodeType: null,
        utility: 0,
        reason: "lstm_prediction_error",
        requiredMemory: requiredMemory
      };
    }
  };

  // Helper function for segment-aware utility modification
  const getSegmentUtilityModifier = (segmentType) => {
    switch (segmentType) {
      case "speed-up":
        return 1.3; // Higher preference for edge processing
      case "slow-down":
        return 0.9; // Less urgent, remote cloud acceptable
      case "turn":
        return 1.1; // Slight preference for edge
      case "traffic-light":
        return 1.5; // Strong preference for edge (stopped, need immediate processing)
      case "merge":
        return 1.2; // Prefer edge for complex maneuvers
      case "exit":
        return 0.8; // Less critical
      default:
        return 1.0; // Neutral
    }
  };

  // Helper function to analyze trajectory for assignment
  const analyzeTrajectoryForAssignment = (trajectoryPrediction, requiredMemory) => {
    let bestNode = null;
    let bestNodeType = null;
    let maxUtility = 0;
    const analysisDetails = [];

    // Get remote cloud baseline
    const remoteClouds = centralNodes.filter(node => node.nodeType === "cloud");
    if (remoteClouds.length === 0) {
      return { bestNode: null, bestNodeType: null, maxUtility: 0, analysisDetails: [] };
    }

    const remoteCloud = remoteClouds[0];

    // Analyze each predicted position in trajectory
    trajectoryPrediction.forEach((prediction, index) => {
      const weightedPosition = {
        x: prediction.canvas.x,
        y: prediction.canvas.y,
        id: `predicted_${index}`
      };

      const remoteLatency = calculateLatency(weightedPosition, remoteCloud.id, "central");
      const stepWeight = prediction.confidence; // Confidence decreases over time

      // Check each edge node for this predicted position
      edgeNodes.forEach(cloudlet => {
        const availableMemory = cloudlet.totalMemory - cloudlet.usedMemory;
        
        if (availableMemory >= requiredMemory) {
          const cloudletLatency = calculateLatency(weightedPosition, cloudlet.id, "edge");
          const stepUtility = (remoteLatency - cloudletLatency) * stepWeight;
          
          analysisDetails.push({
            step: index + 1,
            cloudletId: cloudlet.id,
            position: prediction.canvas,
            utility: stepUtility,
            confidence: stepWeight,
            latency: cloudletLatency
          });

          if (stepUtility > maxUtility) {
            maxUtility = stepUtility;
            bestNode = cloudlet;
            bestNodeType = "edge";
          }
        }
      });
    });

    // If no edge node provides benefit, fallback to remote cloud
    if (!bestNode) {
      bestNode = remoteCloud;
      bestNodeType = "central";
      maxUtility = 0;
    }

    return {
      bestNode: bestNode,
      bestNodeType: bestNodeType,
      maxUtility: maxUtility,
      analysisDetails: analysisDetails,
      trajectoryLength: trajectoryPrediction.length
    };
  };

  // GDY (Greedy) Assignment Algorithm
  const greedyAssignment = (user, requiredMemory) => {
    // 1. Calculate latency at remote cloud (baseline)
    const remoteClouds = centralNodes.filter(node => node.nodeType === "cloud");
    if (remoteClouds.length === 0) {
      return {
        assignedNode: null,
        nodeType: null,
        utility: 0,
        reason: "no_remote_cloud_available",
        requiredMemory: requiredMemory
      };
    }

    // Use first available remote cloud as baseline
    const remoteCloud = remoteClouds[0];
    const remoteCloudLatency = calculateLatency(user, remoteCloud.id, "central");

    // 2. Find best cloudlet based on utility maximization
    let bestCloudlet = null;
    let maxUtility = 0;
    let bestUtilityInfo = null;

    edgeNodes.forEach(cloudlet => {
      // Check memory constraint: Mv >= mu (available memory >= required memory)
      const availableMemory = cloudlet.totalMemory - cloudlet.usedMemory;
      
      if (availableMemory >= requiredMemory) {
        // Calculate latency at cloudlet (includes cold start if needed)
        const cloudletLatency = calculateLatency(user, cloudlet.id, "edge");
        
        // Calculate utility: H(u,v,t) = D(u,v0,t) - D(u,v,t) 
        const utility = remoteCloudLatency - cloudletLatency;
        
        if (utility > maxUtility) {
          maxUtility = utility;
          bestCloudlet = cloudlet;
          bestUtilityInfo = {
            cloudletLatency: cloudletLatency,
            remoteLatency: remoteCloudLatency,
            availableMemory: availableMemory
          };
        }
      }
    });

    // 3. Make assignment decision
    if (bestCloudlet && maxUtility > 0) {
      // Assign to best cloudlet
      return {
        assignedNode: bestCloudlet.id,
        nodeType: "edge",
        utility: maxUtility,
        reason: "utility_maximized",
        requiredMemory: requiredMemory,
        debugInfo: bestUtilityInfo
      };
    } else {
      // Fallback to remote cloud
      return {
        assignedNode: remoteCloud.id,
        nodeType: "central", 
        utility: 0,
        reason: bestCloudlet ? "no_utility_gain" : "memory_constraint",
        requiredMemory: requiredMemory,
        debugInfo: {
          remoteLatency: remoteCloudLatency,
          checkedCloudlets: edgeNodes.length
        }
      };
    }
  };

  // Legacy function for compatibility - now returns empty array
  const predictUserMobility = (user) => {
    // This function is kept for backward compatibility
    // Actual prediction now happens in predictUserAssignment()
    return [];
  };

  // Assignment optimization using prediction algorithms
  const optimizeReplicaPlacement = useCallback(() => {
    if (!predictionEnabled) return;

    const updatedUsers = users.map((user) => {
      // ENSURE USER HAS FIXED VALUES (Option 1 + 2 Migration)
      const userWithFixedValues = ensureUserFixedValues(user);
      const predictedPath = predictUserMobility(userWithFixedValues); // Legacy compatibility
      
      // Skip automatic assignment if user has manual connection
      if (userWithFixedValues.manualConnection || !autoAssignment) {
        return {
          ...userWithFixedValues,
          predictedPath,
        };
      }

      // MEMORY CLEANUP: Deallocate previous assignment memory
      if (userWithFixedValues.assignedEdge && userWithFixedValues.assignmentInfo) {
        const previousCloudlet = edgeNodes.find(edge => edge.id === userWithFixedValues.assignedEdge);
        if (previousCloudlet && userWithFixedValues.assignmentInfo.requiredMemory) {
          previousCloudlet.usedMemory = Math.max(0, previousCloudlet.usedMemory - userWithFixedValues.assignmentInfo.requiredMemory);
        }
      }

      // USE PREDICTION ALGORITHM FOR ASSIGNMENT
      const assignmentPrediction = predictUserAssignment(userWithFixedValues);
      
      // Apply assignment decision
      let assignedEdge = null;
      let assignedCentral = null;
      let latency = 500; // Default high latency
      
      if (assignmentPrediction.assignedNode) {
        if (assignmentPrediction.nodeType === "edge") {
          assignedEdge = assignmentPrediction.assignedNode;
          assignedCentral = null;
          // Update memory usage for cloudlet
          const targetCloudlet = edgeNodes.find(edge => edge.id === assignmentPrediction.assignedNode);
          if (targetCloudlet) {
            targetCloudlet.usedMemory += assignmentPrediction.requiredMemory;
            // Calculate actual latency
            latency = calculateLatency(user, assignmentPrediction.assignedNode, "edge");
          }
        } else if (assignmentPrediction.nodeType === "central") {
          assignedEdge = null;
          assignedCentral = assignmentPrediction.assignedNode;
          // Remote cloud has unlimited memory, no need to update usedMemory
          latency = calculateLatency(user, assignmentPrediction.assignedNode, "central");
        }
      }

      return {
        ...userWithFixedValues,
        predictedPath,
        assignedEdge,
        assignedCentral,
        latency,
        // GDY DEBUG INFO
        assignmentInfo: {
          algorithm: selectedAlgorithm,
          utility: assignmentPrediction.utility,
          reason: assignmentPrediction.reason,
          requiredMemory: assignmentPrediction.requiredMemory
        }
      };
    });

    setUsers(updatedUsers);

    const avgLatency =
      updatedUsers.reduce((sum, user) => sum + user.latency, 0) /
        updatedUsers.length || 0;
    setTotalLatency(Math.round(avgLatency));

    // Update edge node loads and memory usage
    const updatedEdges = edgeNodes.map((edge) => {
      const assignedUsers = updatedUsers.filter(
        (user) => user.assignedEdge === edge.id
      );
      const load = (assignedUsers.length / (edge.capacity / 10)) * 100;
      
      // Memory usage is already updated above, just sync the state
      return { 
        ...edge, 
        currentLoad: Math.min(100, load),
        memoryUsagePercent: Math.min(100, (edge.usedMemory / edge.totalMemory) * 100)
      };
    });
    setEdgeNodes(updatedEdges);

    // Update central node loads  
    const updatedCentrals = centralNodes.map((central) => {
      const assignedUsers = updatedUsers.filter(
        (user) => user.assignedCentral === central.id
      );
      const load = (assignedUsers.length / (central.capacity / 10)) * 100;
      return { ...central, currentLoad: Math.min(100, load) };
    });
    setCentralNodes(updatedCentrals);
  }, [
    users,
    edgeNodes,
    centralNodes,
    predictionEnabled,
    selectedAlgorithm,
    predictionSteps,
    autoAssignment,
  ]);

  // Create refs for state to avoid re-render loops
  const stateRef = useRef();
  stateRef.current = {
    users,
    edgeNodes,
    centralNodes,
    selectedUser,
    selectedEdge,
    selectedCentral,
    predictionEnabled,
    userSize: userSize[0],
    zoomLevel,
    panOffset
  };

  // Canvas drawing function with minimal dependencies - moved before animation useEffect
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = stateRef.current;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Apply transformations
    ctx.save();
    ctx.translate(state.panOffset.x, state.panOffset.y);
    ctx.scale(state.zoomLevel, state.zoomLevel);

    // Clear canvas
    ctx.clearRect(-state.panOffset.x / state.zoomLevel, -state.panOffset.y / state.zoomLevel, 
                  canvas.width / state.zoomLevel, canvas.height / state.zoomLevel);

    // Draw grid background
    const gridSize = 50; // Size of each grid cell
    const startX = Math.floor(-state.panOffset.x / state.zoomLevel / gridSize) * gridSize;
    const startY = Math.floor(-state.panOffset.y / state.zoomLevel / gridSize) * gridSize;
    const endX = startX + (canvas.width / state.zoomLevel) + gridSize;
    const endY = startY + (canvas.height / state.zoomLevel) + gridSize;

    ctx.strokeStyle = "#e5e7eb"; // Light gray grid lines
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;

    // Draw vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1; // Reset opacity

    // Draw connections first (behind everything)
    state.users.forEach((user) => {
      if (user.assignedEdge) {
        const edgeNode = state.edgeNodes.find(edge => edge.id === user.assignedEdge);
        if (edgeNode) {
      ctx.beginPath();
          ctx.moveTo(user.x, user.y);
          ctx.lineTo(edgeNode.x, edgeNode.y);
          ctx.strokeStyle = user.manualConnection ? "#f97316" : "#3b82f6";
          ctx.lineWidth = 2;
      ctx.stroke();
    }
      }
      if (user.assignedCentral) {
        const centralNode = state.centralNodes.find(central => central.id === user.assignedCentral);
        if (centralNode) {
        ctx.beginPath();
          ctx.moveTo(user.x, user.y);
          ctx.lineTo(centralNode.x, centralNode.y);
          ctx.strokeStyle = user.manualConnection ? "#f97316" : "#6b7280";
          ctx.lineWidth = 2;
        ctx.stroke();
        }
      }
    });

    // Draw predicted paths
    if (state.predictionEnabled) {
      state.users.forEach((user) => {
        if (user.predictedPath && user.predictedPath.length > 0) {
        ctx.beginPath();
          ctx.moveTo(user.x, user.y);
          user.predictedPath.forEach((point, index) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      });
    }

    // Draw edge nodes
    state.edgeNodes.forEach((edge) => {
      const isSelected = state.selectedEdge && state.selectedEdge.id === edge.id;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(edge.x, edge.y, 15, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#16a34a" : "#22c55e";
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#15803d" : "#16a34a";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Warm indicator
      if (edge.isWarm) {
      ctx.beginPath();
        ctx.arc(edge.x + 10, edge.y - 10, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "#10b981";
      ctx.fill();
      }

      // Label
      ctx.fillStyle = "#000";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(edge.id, edge.x, edge.y - 20);
    });

    // Draw central nodes
    state.centralNodes.forEach((central) => {
      const isSelected = state.selectedCentral && state.selectedCentral.id === central.id;
      
      // Node square
      ctx.fillStyle = isSelected ? "#2563eb" : "#3b82f6";
      ctx.fillRect(central.x - 12, central.y - 12, 24, 24);
      ctx.strokeStyle = isSelected ? "#1d4ed8" : "#2563eb";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(central.x - 12, central.y - 12, 24, 24);

      // Warm indicator
      if (central.isWarm) {
      ctx.beginPath();
        ctx.arc(central.x + 10, central.y - 10, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "#10b981";
      ctx.fill();
      }

      // Label
      ctx.fillStyle = "#000";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(central.id, central.x, central.y - 20);
    });

    // Draw users
    state.users.forEach((user) => {
      const isSelected = state.selectedUser && state.selectedUser.id === user.id;
      
      // User circle
        ctx.beginPath();
      ctx.arc(user.x, user.y, state.userSize, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#dc2626" : user.manualConnection ? "#f97316" : "#ef4444";
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#b91c1c" : "#dc2626";
      ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

      // Label
      ctx.fillStyle = "#000";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(user.id, user.x, user.y + state.userSize + 12);
    });

    ctx.restore();
  }, []); // Empty dependency array to prevent re-creation

  // Animation loop - Fixed to prevent continuous restarts
  useEffect(() => {
    const interval = setInterval(() => {
      // Call functions directly to get latest state
      if (isSimulating) {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        let newX = user.x + user.vx * simulationSpeed[0];
        let newY = user.y + user.vy * simulationSpeed[0];
        let newVx = user.vx;
        let newVy = user.vy;

        if (newX <= 10 || newX >= window.innerWidth - 10) {
          newVx = -newVx;
          newX = Math.max(10, Math.min(window.innerWidth - 10, newX));
        }
        if (newY <= 10 || newY >= window.innerHeight - 10) {
          newVy = -newVy;
          newY = Math.max(10, Math.min(window.innerHeight - 10, newY));
        }

        return { ...user, x: newX, y: newY, vx: newVx, vy: newVy };
      })
    );
        
        // Trigger optimization during simulation
        setTimeout(() => optimizeReplicaPlacement(), 10);
      }
      
      // Trigger canvas redraw
      draw();
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, draw, optimizeReplicaPlacement]);



  // Container timeout management - reset warm state after 30 seconds of inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const timeoutDuration = 30000; // 30 seconds

      // Reset warm state for edge nodes
      setEdgeNodes(prev => prev.map(edge => {
        if (edge.isWarm && edge.lastAccessTime && 
            (currentTime - edge.lastAccessTime) > timeoutDuration) {
          return { ...edge, isWarm: false, lastAccessTime: null };
        }
        return edge;
      }));

      // Reset warm state for central nodes
      setCentralNodes(prev => prev.map(central => {
        if (central.isWarm && central.lastAccessTime && 
            (currentTime - central.lastAccessTime) > timeoutDuration) {
          return { ...central, isWarm: false, lastAccessTime: null };
        }
        return central;
      }));
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);



  // Find nearest node helper function
  const findNearestNode = (nodes, user) => {
    if (nodes.length === 0) return null;
    return nodes.reduce((nearest, node) => {
      const distanceToNode = calculateDistance(user.x, user.y, node.x, node.y);
      const distanceToNearest = nearest
        ? calculateDistance(user.x, user.y, nearest.x, nearest.y)
        : Number.POSITIVE_INFINITY;
      return distanceToNode < distanceToNearest ? node : nearest;
    });
  };

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(3, prev + 0.2));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(0.5, prev - 0.2));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // useEffect hooks for drawing - placed after draw function definition
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  // Trigger draw when state changes
  useEffect(() => {
    draw();
  }, [users, edgeNodes, centralNodes, selectedUser, selectedEdge, selectedCentral, 
      predictionEnabled, userSize, zoomLevel, panOffset, draw]);



  // Canvas event handlers
  const handleCanvasClick = (e) => {
    if (isDraggingNode || isDraggingUser || isPanning) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

    // Check if clicking on existing elements first
    let clickedSomething = false;

    // Check users
    for (const user of users) {
      const distance = calculateDistance(x, y, user.x, user.y);
      if (distance <= userSize[0]) {
        setSelectedUser(selectedUser && selectedUser.id === user.id ? null : user);
        setSelectedEdge(null);
        setSelectedCentral(null);
        clickedSomething = true;
        break;
      }
    }

    // Check edge nodes
    if (!clickedSomething) {
      for (const edge of edgeNodes) {
        const distance = calculateDistance(x, y, edge.x, edge.y);
        if (distance <= 15) {
          setSelectedEdge(selectedEdge && selectedEdge.id === edge.id ? null : edge);
          setSelectedUser(null);
          setSelectedCentral(null);
          clickedSomething = true;
          break;
        }
      }
    }

    // Check central nodes
    if (!clickedSomething) {
      for (const central of centralNodes) {
        if (x >= central.x - 12 && x <= central.x + 12 && 
            y >= central.y - 12 && y <= central.y + 12) {
          setSelectedCentral(selectedCentral && selectedCentral.id === central.id ? null : central);
          setSelectedUser(null);
          setSelectedEdge(null);
          clickedSomething = true;
          break;
        }
      }
    }

    // If nothing was clicked and we're not in edit mode, add a new user
    if (!clickedSomething && editMode === "none") {
      const newUser = {
        id: `user-${users.length + 1}`,
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * userSpeed[0],
        vy: (Math.random() - 0.5) * userSpeed[0],
        assignedEdge: null,
        assignedCentral: null,
        manualConnection: false,
        latency: 500, // FIXED initial latency for new users
        predictedPath: [],
        // STABLE VALUES (Option 1 + 2)
        fixedDataSize: FIXED_DATA_SIZE, // Fixed 300MB per user
        fixedContainerMemory: FIXED_CONTAINER_MEMORY, // Fixed 1GB per user
      };
      setUsers(prev => [...prev, newUser]);
    }

    // Clear selections if clicking empty space
    if (!clickedSomething && editMode !== "none") {
      setSelectedUser(null);
      setSelectedEdge(null);
      setSelectedCentral(null);
    }
  };

  const handleMouseDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

    // Check for draggable elements
    if (editMode === "users" || editMode === "both") {
      for (const user of users) {
        const distance = calculateDistance(x, y, user.x, user.y);
        if (distance <= userSize[0]) {
          setIsDraggingUser(true);
          setDraggedUser(user);
          setDragOffset({ x: x - user.x, y: y - user.y });
          return;
        }
      }
    }

    if (editMode === "nodes" || editMode === "both") {
      // Check edge nodes
      for (const edge of edgeNodes) {
        const distance = calculateDistance(x, y, edge.x, edge.y);
        if (distance <= 15) {
          setIsDraggingNode(true);
          setDraggedNode({ ...edge, type: "edge" });
          setDragOffset({ x: x - edge.x, y: y - edge.y });
          return;
        }
      }

      // Check central nodes
      for (const central of centralNodes) {
        if (x >= central.x - 12 && x <= central.x + 12 && 
            y >= central.y - 12 && y <= central.y + 12) {
          setIsDraggingNode(true);
          setDraggedNode({ ...central, type: "central" });
          setDragOffset({ x: x - central.x, y: y - central.y });
          return;
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

    if (isDraggingUser && draggedUser) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;
      
      setUsers(prev => prev.map(user => 
        user.id === draggedUser.id 
          ? { ...user, x: Math.max(10, Math.min(window.innerWidth - 10, newX)), 
                       y: Math.max(10, Math.min(window.innerHeight - 10, newY)) }
          : user
      ));
    }

    if (isDraggingNode && draggedNode) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;
      
      if (draggedNode.type === "edge") {
        setEdgeNodes(prev => prev.map(edge => 
          edge.id === draggedNode.id 
            ? { ...edge, x: Math.max(10, Math.min(window.innerWidth - 10, newX)), 
                         y: Math.max(10, Math.min(window.innerHeight - 10, newY)) }
            : edge
        ));
      } else if (draggedNode.type === "central") {
        setCentralNodes(prev => prev.map(central => 
          central.id === draggedNode.id 
            ? { ...central, x: Math.max(10, Math.min(window.innerWidth - 10, newX)), 
                           y: Math.max(10, Math.min(window.innerHeight - 10, newY)) }
            : central
        ));
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingUser(false);
    setIsDraggingNode(false);
    setDraggedUser(null);
    setDraggedNode(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  // Simulation step function
  const simulationStep = () => {
    if (isSimulating) {
      optimizeReplicaPlacement();
    }
  };

  const resetSimulation = () => {
    clearEverything();
  };

  const addEdgeNode = () => {
    const newEdge = {
      id: `edge-${edgeNodes.length + 1}`,
      x: Math.random() * (window.innerWidth - 200) + 100,
      y: Math.random() * (window.innerHeight - 200) + 100,
      capacity: edgeCapacity[0],
      currentLoad: 0,
      replicas: [],
      coverage: edgeCoverage[0],
      isWarm: false,
      lastAccessTime: null,
      lastMetrics: null,
      type: "cloudlet",
      // MEMORY MANAGEMENT for GDY Algorithm
      totalMemory: 5000 + Math.random() * 3000, // 5-8 GB in MB
      usedMemory: 0,
      availableMemory: function() { return this.totalMemory - this.usedMemory; },
      containers: new Map() // Track containers per user
    };
    setEdgeNodes((prev) => [...prev, newEdge]);
  };

  const removeEdgeNode = () => {
    if (edgeNodes.length > 0) {
      const nodeToRemove = edgeNodes[edgeNodes.length - 1];
      setEdgeNodes((prev) => prev.slice(0, -1));
      if (selectedEdge && selectedEdge.id === nodeToRemove.id) {
        setSelectedEdge(null);
      }
    }
  };

  const addCentralNode = () => {
    const newCentral = {
      id: `central-${centralNodes.length + 1}`,
      x: Math.random() * (window.innerWidth - 400) + 200,
      y: Math.random() * (window.innerHeight - 400) + 200,
      capacity: centralCapacity[0],
      currentLoad: 0,
      coverage: centralCoverage[0],
      type: "main",
      isWarm: false,
      lastAccessTime: null,
      lastMetrics: null,
      nodeType: "cloud",
      // REMOTE CLOUD - UNLIMITED MEMORY
      totalMemory: Number.POSITIVE_INFINITY, // Unlimited memory
      usedMemory: 0,
      availableMemory: function() { return Number.POSITIVE_INFINITY; },
      containers: new Map() // Track containers per user
    };
    setCentralNodes((prev) => [...prev, newCentral]);
  };

  const removeCentralNode = () => {
    if (centralNodes.length > 0) {
      setCentralNodes((prev) => prev.slice(0, -1));
      if (
        selectedCentral &&
        selectedCentral.id === `central-${centralNodes.length}`
      ) {
        setSelectedCentral(null);
      }
    }
  };

  const deleteSelectedNode = () => {
    if (selectedEdge) {
      setEdgeNodes((prev) =>
        prev.filter((edge) => edge.id !== selectedEdge.id)
      );
      setSelectedEdge(null);
    }
    if (selectedCentral) {
      setCentralNodes((prev) =>
        prev.filter((central) => central.id !== selectedCentral.id)
      );
      setSelectedCentral(null);
    }
  };

  const clearAllUsers = () => {
    setUsers([]);
    setSelectedUser(null);
  };

  const clearAllEdgeNodes = () => {
    setEdgeNodes([]);
    setSelectedEdge(null);
  };

  const clearAllCentralNodes = () => {
    setCentralNodes([]);
    setSelectedCentral(null);
  };

  const clearEverything = () => {
    setUsers([]);
    setEdgeNodes([]);
    setCentralNodes([]);
    setSelectedUser(null);
    setSelectedEdge(null);
    setSelectedCentral(null);
    setIsSimulating(false);
    setTotalLatency(0);
  };

  const getEditModeDescription = () => {
    switch (editMode) {
      case "nodes":
        return "Node Edit: Drag nodes to move • Click to select";
      case "users":
        return "User Edit: Drag users to move • Click to select";
      case "both":
        return "Full Edit: Drag nodes and users • Click to select";
      default:
        return "Click to add users • Mouse wheel to zoom • Ctrl+drag to pan the map";
    }
  };

  const getCursorStyle = () => {
    if (isPanning) return "grabbing";
    if (isDraggingNode || isDraggingUser) return "grabbing";
    if (editMode !== "none") return "move";
    return "crosshair";
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Full Screen Canvas */}
      <SimulationCanvas
        canvasRef={canvasRef}
        handleCanvasClick={handleCanvasClick}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleWheel={handleWheel}
        getCursorStyle={getCursorStyle}
      />

      {/* Left Control Panel */}
      <ControlPanel leftPanelOpen={leftPanelOpen}>
        <ControlPanelContent
          users={users}
          setUsers={setUsers}
          edgeNodes={edgeNodes}
          setEdgeNodes={setEdgeNodes}
          centralNodes={centralNodes}
          setCentralNodes={setCentralNodes}
          isSimulating={isSimulating}
          setIsSimulating={setIsSimulating}
          simulationSpeed={simulationSpeed}
          setSimulationSpeed={setSimulationSpeed}
          predictionEnabled={predictionEnabled}
          setPredictionEnabled={setPredictionEnabled}
          totalLatency={totalLatency}
          setTotalLatency={setTotalLatency}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          leftPanelOpen={leftPanelOpen}
          setLeftPanelOpen={setLeftPanelOpen}
          rightPanelOpen={rightPanelOpen}
          setRightPanelOpen={setRightPanelOpen}
          selectedAlgorithm={selectedAlgorithm}
          setSelectedAlgorithm={setSelectedAlgorithm}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          selectedEdge={selectedEdge}
          setSelectedEdge={setSelectedEdge}
          selectedCentral={selectedCentral}
          setSelectedCentral={setSelectedCentral}
          userSpeed={userSpeed}
          setUserSpeed={setUserSpeed}
          userSize={userSize}
          setUserSize={setUserSize}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetZoom={resetZoom}
          predictionSteps={predictionSteps}
          setPredictionSteps={setPredictionSteps}
          edgeCapacity={edgeCapacity}
          setEdgeCapacity={setEdgeCapacity}
          edgeCoverage={edgeCoverage}
          setEdgeCoverage={setEdgeCoverage}
          centralCapacity={centralCapacity}
          setCentralCapacity={setCentralCapacity}
          centralCoverage={centralCoverage}
          setCentralCoverage={setCentralCoverage}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          panOffset={panOffset}
          setPanOffset={setPanOffset}
          isPanning={isPanning}
          setIsPanning={setIsPanning}
          lastPanPoint={lastPanPoint}
          setLastPanPoint={setLastPanPoint}
          editMode={editMode}
          setEditMode={setEditMode}
          isDraggingNode={isDraggingNode}
          setIsDraggingNode={setIsDraggingNode}
          isDraggingUser={isDraggingUser}
          setIsDraggingUser={setIsDraggingUser}
          draggedNode={draggedNode}
          setDraggedNode={setDraggedNode}
          draggedUser={draggedUser}
          setDraggedUser={setDraggedUser}
          dragOffset={dragOffset}
          setDragOffset={setDragOffset}
          manualConnectionMode={manualConnectionMode}
          setManualConnectionMode={setManualConnectionMode}
          autoAssignment={autoAssignment}
          setAutoAssignment={setAutoAssignment}
          algorithms={algorithms}
          calculateDistance={calculateDistance}
          connectUserToNode={connectUserToNode}
          disconnectUser={disconnectUser}
          resetAllConnections={resetAllConnections}
          updateSelectedUser={updateSelectedUser}
          deleteSelectedUser={deleteSelectedUser}
          predictUserMobility={predictUserMobility}
          optimizeReplicaPlacement={optimizeReplicaPlacement}
          simulationStep={simulationStep}
          handleCanvasClick={handleCanvasClick}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          handleWheel={handleWheel}
          draw={draw}
          resetSimulation={resetSimulation}
          addEdgeNode={addEdgeNode}
          removeEdgeNode={removeEdgeNode}
          addCentralNode={addCentralNode}
          removeCentralNode={removeCentralNode}
          deleteSelectedNode={deleteSelectedNode}
          clearAllUsers={clearAllUsers}
          clearAllEdgeNodes={clearAllEdgeNodes}
          clearAllCentralNodes={clearAllCentralNodes}
          clearEverything={clearEverything}
          getEditModeDescription={getEditModeDescription}
          getCursorStyle={getCursorStyle}
          // LSTM-related props
          isLSTMInitialized={isLSTMInitialized}
          isLSTMTrained={isLSTMTrained}
          lstmPredictor={lstmPredictor}
          trajectoryMode={trajectoryMode}
          setTrajectoryMode={setTrajectoryMode}
          initializeLSTM={initializeLSTM}
        />
      </ControlPanel>

      {/* Right Metrics Panel */}
      <MetricsPanel rightPanelOpen={rightPanelOpen}>
        <MetricsPanelContent
          users={users}
          edgeNodes={edgeNodes}
          centralNodes={centralNodes}
          totalLatency={totalLatency}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          selectedEdge={selectedEdge}
          setSelectedEdge={setSelectedEdge}
          selectedCentral={selectedCentral}
          setSelectedCentral={setSelectedCentral}
          algorithms={algorithms}
          selectedAlgorithm={selectedAlgorithm}
          rightPanelOpen={rightPanelOpen}
          setRightPanelOpen={setRightPanelOpen}
        />
      </MetricsPanel>

      {/* Toggle Buttons for Panels */}
      {!leftPanelOpen && (
        <Button
          className="absolute left-4 top-4 z-20"
          size="sm"
          onClick={() => setLeftPanelOpen(true)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      )}
      {!rightPanelOpen && (
        <Button
          className="absolute right-4 top-4 z-20"
          size="sm"
          onClick={() => setRightPanelOpen(true)}
        >
          <MapPin className="w-4 h-4" />
        </Button>
      )}

      {/* Instructions */}
      <EditModeDescription description={getEditModeDescription()} />
    </div>
  );
}
