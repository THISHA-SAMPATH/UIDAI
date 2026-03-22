import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# ==========================================
# CONFIGURATION
# ==========================================
INPUT_FILE = 'data/all_india_state_predictions.csv'
TOP_N_stateS = 10  # Number of states to show in the Trend Chart

# Set the visual style
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (12, 6)

def visualize_results():
    print("--- Generatng Visualizations ---")
    
    # 1. Load Data
    try:
        df = pd.read_csv(INPUT_FILE)
        df['Date'] = pd.to_datetime(df['Date'])
    except FileNotFoundError:
        print(f"❌ Error: Could not find {INPUT_FILE}. Run main.py first!")
        return

    # 2. Calculate Total Demand per state (to find the biggest ones)
    state_totals = df.groupby('Region')['Predicted_Demand'].sum().sort_values(ascending=False)
    top_states = state_totals.head(TOP_N_stateS).index.tolist()
    
    print(f"Top {TOP_N_stateS} states by Volume: {', '.join(top_states)}")

    # ==========================================
    # CHART 1: DEMAND TREND (Line Chart)
    # ==========================================
    plt.figure(figsize=(14, 7))
    
    # Filter data to only show top states (avoids a messy graph)
    plot_data = df[df['Region'].isin(top_states)]
    
    sns.lineplot(data=plot_data, x='Date', y='Predicted_Demand', hue='Region', marker='o', linewidth=2.5)
    
    plt.title(f'Predicted Aadhaar Demand: Top {TOP_N_stateS} states (Next 7 Days)', fontsize=16, fontweight='bold')
    plt.xlabel('Date', fontsize=12)
    plt.ylabel('Projected Enrollments/Updates', fontsize=12)
    plt.legend(title='state', title_fontsize='12')
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Save it
    plt.savefig('chart_demand_trend.png')
    print("✓ Saved 'chart_demand_trend.png'")
    plt.show()

    # ==========================================
    # CHART 2: TOTAL RESOURCE LOAD (Bar Chart)
    # ==========================================
    plt.figure(figsize=(14, 8))
    
    # Show Top 15 states for the bar chart
    top_15 = state_totals.head(15).reset_index()
    
    barplot = sns.barplot(data=top_15, x='Predicted_Demand', y='Region', palette='viridis')
    
    plt.title('Total Predicted Resource Requirement (Next 7 Days)', fontsize=16, fontweight='bold')
    plt.xlabel('Total Predicted Volume', fontsize=12)
    plt.ylabel('state', fontsize=12)
    
    # Add numbers to the ends of the bars
    for i in barplot.containers:
        barplot.bar_label(i, padding=3)
        
    plt.tight_layout()
    
    # Save it
    plt.savefig('chart_total_load.png')
    print("✓ Saved 'chart_total_load.png'")
    plt.show()

if __name__ == "__main__":
    visualize_results()