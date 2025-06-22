# filepath: /hierarchical-digital-twin/hierarchical-digital-twin/src/config/simulation_config.py

# Configuration settings for the simulation of the hierarchical digital twin system

# Digital Twin Hierarchy Configuration
CENTRAL_DT_STORAGE_MB = 1000  # Storage capacity for the central digital twin
EDGE_DT_STORAGE_MB = 500        # Storage capacity for each edge digital twin
DT_REPLICA_SIZE_MB = 100        # Size of each digital twin replica

# Simulation Parameters
SIMULATION_STEPS = 10           # Number of steps in the simulation
PREDICTION_WINDOW = 2           # Number of future steps to predict user mobility

# Network Topology Configuration
NUM_EDGE_NODES = 5              # Number of edge nodes in the network
EDGE_CONNECTION_PROBABILITY = 0.5  # Probability of connection between edge nodes

# User Mobility Configuration
USER_MOBILITY_TRACE_LENGTH = SIMULATION_STEPS  # Length of the user mobility trace
