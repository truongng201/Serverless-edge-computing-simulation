import networkx as nx
import matplotlib.pyplot as plt
import numpy as np
import time

def visualize_digital_twin_network(G, pos, current_user_location, replicas_info, central_info, title, user_info=None, calculations=None):
    """Enhanced visualization with central server, edge nodes, and user mobility"""
    plt.figure(figsize=(14, 10))
    
    # Define node colors and sizes
    node_colors = []
    node_sizes = []
    
    for node in G.nodes:
        if node == "CentralDT":
            node_colors.append("gold")  # Central server in gold
            node_sizes.append(2500)
        elif node == current_user_location:
            node_colors.append("red")  # Current user location in red
            node_sizes.append(1800)
        elif replicas_info.get(node):
            node_colors.append("lightgreen")  # Edge nodes with replicas
            node_sizes.append(1500)
        else:
            node_colors.append("lightblue")  # Other edge nodes
            node_sizes.append(1500)
    
    # Draw the network
    nx.draw(G, pos, with_labels=True, node_color=node_colors, node_size=node_sizes, 
            font_size=10, font_weight='bold', edge_color='gray', width=2)
    
    # Add detailed labels for each node
    for node in G.nodes:
        x, y = pos[node]
        if node == "CentralDT":
            label = f"Central Server\n{central_info['storage_MB']}MB\n{central_info['total_replicas']} Replicas"
            plt.text(x, y - 0.15, label, ha='center', va='center', fontsize=9, 
                    bbox=dict(facecolor='yellow', alpha=0.7, edgecolor='orange', boxstyle='round,pad=0.3'))
        elif node in replicas_info:
            info = replicas_info[node]
            label = f"{node}\nStorage: {info['storage_MB']}MB\nReplicas: {len(info['replicas'])}\nUsers: {info['active_users']}"
            bbox_color = 'lightcoral' if node == current_user_location else 'lightgreen'
            plt.text(x, y + 0.12, label, ha='center', va='center', fontsize=8, 
                    bbox=dict(facecolor=bbox_color, alpha=0.8, edgecolor='black', boxstyle='round,pad=0.2'))
    
    # Add user information
    if user_info:
        user_text = f"User Location: {current_user_location}\nLatency: {user_info.get('latency', 'N/A')}ms\nBandwidth: {user_info.get('bandwidth', 'N/A')}Mbps"
        plt.text(0.02, 0.98, user_text, transform=plt.gca().transAxes, fontsize=10,
                bbox=dict(facecolor='white', alpha=0.9, edgecolor='blue'), verticalalignment='top')
    
    # Add calculation information
    if calculations:
        calc_text = "Step Calculations:\n"
        for key, value in calculations.items():
            calc_text += f"{key}: {value}\n"
        plt.text(0.02, 0.02, calc_text, transform=plt.gca().transAxes, fontsize=9,
                bbox=dict(facecolor='lightyellow', alpha=0.9, edgecolor='orange'), verticalalignment='bottom')
    
    plt.title(title, fontsize=14, fontweight='bold')
    plt.axis('off')
    
    # Add legend
    legend_elements = [
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='gold', markersize=15, label='Central Server'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='red', markersize=12, label='Current User Location'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='lightgreen', markersize=12, label='Edge Server'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='lightblue', markersize=12, label='Available Server')
    ]
    plt.legend(handles=legend_elements, loc='upper right', bbox_to_anchor=(0.98, 0.98))
    
    plt.tight_layout()
    plt.show()

def create_enhanced_network_topology(num_edge_nodes):
    """Create a star network topology with central server connected to all edge nodes only"""
    G = nx.Graph()
    
    # Add central server
    G.add_node("CentralDT", node_type="central", storage_MB=1000)
    
    # Add edge nodes and connect only to central server (star topology)
    edge_nodes = [f"EdgeNode{i}" for i in range(num_edge_nodes)]
    for node in edge_nodes:
        G.add_node(node, node_type="edge", storage_MB=100)
        # Connect each edge node to central server only
        G.add_edge("CentralDT", node, latency=np.random.randint(5, 20))
    
    # No connections between edge nodes (pure star topology)
    
    return G, edge_nodes

def calculate_step_metrics(mobility_simulator, replica_manager, edge_nodes, central_dt):
    """Calculate various metrics for the current simulation step"""
    calculations = {}
    
    # Calculate total active users
    total_users = sum(node.active_users for node in edge_nodes)
    calculations["Total Active Users"] = total_users
    
    # Calculate total storage usage
    total_edge_storage = sum(node.storage_capacity - node.get_available_storage() for node in edge_nodes)
    calculations["Edge Storage Used"] = f"{total_edge_storage}MB"
    
    # Calculate total replicas
    total_replicas = sum(len(node.replicas) for node in edge_nodes)
    calculations["Total Replicas"] = total_replicas
    
    # Calculate network load (simulated)
    network_load = np.random.randint(20, 80)
    calculations["Network Load"] = f"{network_load}%"
    
    # Calculate average latency
    avg_latency = np.random.randint(10, 50)
    calculations["Avg Latency"] = f"{avg_latency}ms"
    
    return calculations