# Hierarchical Digital Twin Project

This project implements a hierarchical digital twin architecture consisting of a central digital twin and multiple edge nodes. The central digital twin manages the overall system, while the edge nodes handle local operations and communicate with the central twin.

## Project Structure

```
hierarchical-digital-twin
├── src
│   ├── main.py                     # Entry point for the application
│   ├── models                       # Contains model definitions
│   │   ├── __init__.py             # Initializes the models package
│   │   ├── central_dt.py            # CentralDigitalTwin class definition
│   │   ├── edge_dt.py               # EdgeDigitalTwin class definition
│   │   └── network_topology.py      # NetworkTopology class definition
│   ├── simulation                   # Contains simulation-related classes
│   │   ├── __init__.py             # Initializes the simulation package
│   │   ├── mobility_simulator.py    # MobilitySimulator class definition
│   │   ├── replica_manager.py       # ReplicaManager class definition
│   │   └── animation_controller.py   # AnimationController class definition
│   ├── utils                        # Contains utility functions
│   │   ├── __init__.py             # Initializes the utils package
│   │   ├── graph_builder.py         # Functions for building the graph
│   │   └── visualization.py         # Functions for visualization
│   └── config                       # Contains configuration settings
│       ├── __init__.py             # Initializes the config package
│       └── simulation_config.py     # Configuration settings for the simulation
├── requirements.txt                 # Project dependencies
├── setup.py                         # Packaging information
└── README.md                        # Project documentation
```

## Installation

To set up the project, clone the repository and install the required dependencies:

```bash
git clone <repository-url>
cd hierarchical-digital-twin
pip install -r requirements.txt
```

## Usage

Run the main application to start the simulation:

```bash
python src/main.py
```

## Overview

The project simulates user mobility across a network of digital twins, where the central digital twin coordinates the activities of edge nodes. The architecture allows for efficient management of resources and real-time data processing, making it suitable for various applications in IoT and smart systems.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.