import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def visual_sanity_check(anomaly_file="data/final_anomaly_report.csv", training_file='findem.csv'):
    # Load your anomaly output (which has both actual and predicted cols)
    # If you don't have this file yet, run the anomaly detector script first
    try:
        df = pd.read_csv(anomaly_file)
        df['date'] = pd.to_datetime(df['date'])
    except:
        print("Could not load anomaly file. Run the detector script first!")
        return

    # Pick 3 random districts to plot
    sample_districts = df['district'].unique()[:3]

    plt.figure(figsize=(15, 5))
    
    for i, district in enumerate(sample_districts):
        subset = df[df['district'] == district].sort_values('date')
        
        plt.subplot(1, 3, i+1)
        plt.plot(subset['date'], subset['actual_count'], label='Actual', alpha=0.7)
        plt.plot(subset['date'], subset['predicted_count'], label='Predicted', linestyle='--', color='red')
        plt.title(f"District: {district}")
        plt.xticks(rotation=45)
        plt.legend()

    plt.tight_layout()
    plt.show()
    print("Graph generated. Do the Red lines roughly follow the Blue lines?")

# Run it
visual_sanity_check()