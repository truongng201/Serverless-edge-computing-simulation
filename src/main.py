from models.central_dt import CentralDigitalTwin
from models.edge_dt import EdgeDigitalTwin
from models.network_topology import NetworkTopology
from simulation.mobility_simulator import MobilitySimulator
from simulation.replica_manager import ReplicaManager
from simulation.animation_controller import AnimationController
from utils.visualization import visualize_digital_twin_network, create_enhanced_network_topology, calculate_step_metrics
from utils.graph_builder import build_graph
from config.simulation_config import *
import networkx as nx
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import time
import numpy as np

def run_animated_simulation():
    """Run the simulation with real-time animated visualization"""
    print("=" * 60)
    print("🎬 ANIMATED HIERARCHICAL DIGITAL TWIN SIMULATION")
    print("=" * 60)
    
    # Initialize the central digital twin
    central_dt = CentralDigitalTwin("CentralDT", CENTRAL_DT_STORAGE_MB)

    # Create network topology
    network_topology = NetworkTopology()
    network_topology.set_central_digital_twin(central_dt)

    # Initialize edge digital twins
    edge_nodes = [EdgeDigitalTwin(f"EdgeNode{i}", EDGE_DT_STORAGE_MB) for i in range(NUM_EDGE_NODES)]
    for edge_node in edge_nodes:
        network_topology.add_edge_node(edge_node)

    # Create enhanced network graph for visualization
    G, edge_names = create_enhanced_network_topology(NUM_EDGE_NODES)
    
    # Create layout with central server in the middle
    pos = {}
    pos["CentralDT"] = (0, 0)  # Central server at origin
    
    # Arrange edge nodes in a circle around the central server
    angle_step = 2 * np.pi / NUM_EDGE_NODES
    radius = 1.5
    for i, node_name in enumerate(edge_names):
        angle = i * angle_step
        pos[node_name] = (radius * np.cos(angle), radius * np.sin(angle))

    # Set up mobility simulator with multiple users (increased from default)
    num_users = 8  # Increased number of users for more activity
    mobility_simulator = MobilitySimulator(central_dt, edge_nodes, num_users)

    # Set up replica manager
    replica_manager = ReplicaManager(central_dt, edge_nodes)

    print(f"\n🚀 Starting animated simulation...")
    print(f"👥 {num_users} users will move through the network")
    print("🎥 Watch the real-time animation showing network activity")
    print("📊 Node sizes and colors change based on user activity")
    print("⏹️ Close the window to end the simulation\n")

    # Create and start simple animated visualization
    def animate_frame(frame):
        plt.clf()
        
        # Simulate one step
        mobility_simulator.simulate_user_mobility(1)
        replica_manager.synchronize_replicas()
        
        # Get current state
        users_summary = mobility_simulator.get_users_summary()
        
        # Prepare visualization data
        replicas_info = {}
        for edge_node in edge_nodes:
            replicas_info[edge_node.name] = {
                'storage_MB': edge_node.get_available_storage(),
                'replicas': edge_node.replicas,
                'active_users': edge_node.active_users
            }
        
        # Central server info
        central_info = {
            'storage_MB': central_dt.get_available_storage(),
            'total_replicas': len(central_dt.replicas)
        }
        
        # Determine which node has most users for highlighting
        current_user_location = None
        if users_summary['user_locations']:
            max_users = max(len(users) for users in users_summary['user_locations'].values())
            for location, users in users_summary['user_locations'].items():
                if len(users) == max_users:
                    current_user_location = location
                    break
        
        # Calculate metrics
        calculations = calculate_step_metrics(mobility_simulator, replica_manager, edge_nodes, central_dt)
        
        # Create title
        title = f"Hierarchical Digital Twin Network - Step {frame + 1}\nUsers: {users_summary['total_users']}, Active Nodes: {len(users_summary['active_nodes'])}"
        
        # Visualize
        visualize_digital_twin_network(G, pos, current_user_location, replicas_info, central_info, 
                                     title, users_summary, calculations)
    
    # Create animation
    fig = plt.figure(figsize=(16, 12))
    ani = animation.FuncAnimation(fig, animate_frame, frames=30, interval=2000, repeat=True)
    plt.show()
    
    print("🎉 Animation completed!")

def run_simulation_with_visualization():
    """Run the simulation with step-by-step visualization"""
    print("=" * 60)
    print("🌐 HIERARCHICAL DIGITAL TWIN SIMULATION")
    print("=" * 60)
    
    # Initialize the central digital twin
    central_dt = CentralDigitalTwin("CentralDT", CENTRAL_DT_STORAGE_MB)

    # Create network topology
    network_topology = NetworkTopology()
    network_topology.set_central_digital_twin(central_dt)

    # Initialize edge digital twins
    edge_nodes = [EdgeDigitalTwin(f"EdgeNode{i}", EDGE_DT_STORAGE_MB) for i in range(NUM_EDGE_NODES)]
    for edge_node in edge_nodes:
        network_topology.add_edge_node(edge_node)

    # Create enhanced network graph for visualization
    G, edge_names = create_enhanced_network_topology(NUM_EDGE_NODES)
    
    # Create layout with central server in the middle
    pos = {}
    pos["CentralDT"] = (0, 0)  # Central server at origin
    
    # Arrange edge nodes in a circle around the central server
    angle_step = 2 * np.pi / NUM_EDGE_NODES
    radius = 1.5
    for i, node_name in enumerate(edge_names):
        angle = i * angle_step
        pos[node_name] = (radius * np.cos(angle), radius * np.sin(angle))

    # Set up mobility simulator with multiple users
    num_users = 6
    mobility_simulator = MobilitySimulator(central_dt, edge_nodes, num_users)

    # Set up replica manager
    replica_manager = ReplicaManager(central_dt, edge_nodes)

    print(f"\n🚀 Starting simulation with {SIMULATION_STEPS} steps...")
    print("📈 Each step shows network state, user movement, and calculations")
    print("❌ Close each plot window to proceed to the next step\n")

    # Run the simulation with enhanced visualization
    for step in range(SIMULATION_STEPS):
        print(f"\n{'='*50}")
        print(f"📍 STEP {step + 1}/{SIMULATION_STEPS}")
        print(f"{'='*50}")
        
        # Simulate user mobility
        mobility_simulator.simulate_user_mobility(1)
        
        # Get current user info and summary
        users_summary = mobility_simulator.get_users_summary()
        primary_user_info = mobility_simulator.get_primary_user_info()
        
        print(f"👥 Active users: {users_summary['total_users']}")
        print(f"🏢 Active nodes: {len(users_summary['active_nodes'])}")
        for location, user_list in users_summary['user_locations'].items():
            print(f"   📍 {location}: {len(user_list)} users")
        
        # Synchronize replicas
        replica_manager.synchronize_replicas()
        
        # Calculate step metrics
        calculations = calculate_step_metrics(mobility_simulator, replica_manager, edge_nodes, central_dt)
        
        print("🔢 Step Calculations:")
        for key, value in calculations.items():
            print(f"   • {key}: {value}")
        
        # Prepare visualization data
        replicas_info = {}
        for edge_node in edge_nodes:
            replicas_info[edge_node.name] = {
                'storage_MB': edge_node.get_available_storage(),
                'replicas': edge_node.replicas,
                'active_users': edge_node.active_users
            }
        
        # Central server info
        central_info = {
            'storage_MB': central_dt.get_available_storage(),
            'total_replicas': len(central_dt.replicas)
        }
        
        # Visualize the current state
        title = f"Hierarchical Digital Twin Network - Step {step + 1}/{SIMULATION_STEPS}\nUsers: {users_summary['total_users']}"
        
        # Get primary user location for highlighting
        current_user_location = None
        if users_summary['user_locations']:
            # Highlight the node with most users
            max_users = max(len(users) for users in users_summary['user_locations'].values())
            for location, users in users_summary['user_locations'].items():
                if len(users) == max_users:
                    current_user_location = location
                    break
        
        visualize_digital_twin_network(G, pos, current_user_location, replicas_info, central_info, 
                                     title, primary_user_info, calculations)
        
        print(f"✅ Step {step + 1} completed")
        
        # Add a small delay for better user experience
        if step < SIMULATION_STEPS - 1:
            print("⏳ Preparing next step...")
            time.sleep(1)

    print(f"\n{'='*60}")
    print("🎉 SIMULATION COMPLETED!")
    print(f"{'='*60}")

def run_simulation_without_visualization():
    """Run the simulation without visualization for faster execution"""
    print("🚀 Starting fast simulation without visualization...")
    
    # Initialize the central digital twin
    central_dt = CentralDigitalTwin("CentralDT", CENTRAL_DT_STORAGE_MB)

    # Create network topology
    network_topology = NetworkTopology()
    network_topology.set_central_digital_twin(central_dt)

    # Initialize edge digital twins
    edge_nodes = [EdgeDigitalTwin(f"EdgeNode{i}", EDGE_DT_STORAGE_MB) for i in range(NUM_EDGE_NODES)]
    for edge_node in edge_nodes:
        network_topology.add_edge_node(edge_node)

    # Set up mobility simulator
    mobility_simulator = MobilitySimulator(central_dt, edge_nodes)
    
    # Get primary user info for display
    primary_user_info = mobility_simulator.get_primary_user_info()
    if primary_user_info:
        print(f"👤 Primary User: {primary_user_info['user_id']} entering the network...")
    else:
        print(f"👤 Multiple users entering the network...")

    # Set up replica manager
    replica_manager = ReplicaManager(central_dt, edge_nodes)

    # Run the simulation
    for step in range(SIMULATION_STEPS):
        mobility_simulator.simulate_user_mobility(1)
        replica_manager.synchronize_replicas()
        
        # Get current user summary
        users_summary = mobility_simulator.get_users_summary()
        active_locations = list(users_summary['user_locations'].keys())
        current_location = active_locations[0] if active_locations else "Unknown"
        print(f"Step {step + 1}/{SIMULATION_STEPS} - Active locations: {', '.join(active_locations) if active_locations else 'None'}")

    print("\n✅ Fast simulation completed!")
    final_summary = mobility_simulator.get_users_summary()
    print(f"Final user distribution: {final_summary['user_locations']}")

def main():
    print("🌐 Hierarchical Digital Twin Simulation")
    print("=" * 60)
    print("1. 🎬 Run with ANIMATED Visualization (real-time animation)")
    print("2. 📊 Run with Step-by-Step Visualization (static plots)")
    print("3. ⚡ Run without Visualization (faster execution)")
    print("=" * 60)
    
    choice = input("Enter your choice (1, 2, or 3): ").strip()
    
    if choice == "1":
        run_animated_simulation()
    elif choice == "2":
        run_simulation_with_visualization()
    elif choice == "3":
        run_simulation_without_visualization()
    else:
        print("❌ Invalid choice. Running animated simulation...")
        run_animated_simulation()

if __name__ == "__main__":
    main()