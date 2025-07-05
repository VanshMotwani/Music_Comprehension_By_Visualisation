import pandas as pd
import joypy
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap


# Load the processed data
top_genre_week_counts_path = 'top_genre_week_counts.csv'
top_genre_week_counts = pd.read_csv(top_genre_week_counts_path)
num_genres = top_genre_week_counts['Genre'].nunique()



# Define a custom green gradient color map
colors = ["darkgreen", "mediumseagreen", "lightgreen"]  # Shades of green from dark to light
cmap = LinearSegmentedColormap.from_list("custom_green", colors, N=num_genres)

# Generate a list of green colors using the custom colormap
np.random.seed(42)  

green_colors = [cmap(i) for i in np.linspace(0, 1, num_genres)]

# Map genres to green gradient colors
genre_to_color = {genre: color for genre, color in zip(top_genre_week_counts['Genre'].unique(), green_colors)}

# Normalizing data by the maximum count 
max_count = top_genre_week_counts['Count'].max()
scale_factor = 120/ max_count
top_genre_week_counts['Normalized Count'] = top_genre_week_counts['Count'] * scale_factor

# Plotting the ridgeline plot with normalized counts
fig, axes = joypy.joyplot(
    top_genre_week_counts, 
    by='Genre', 
    column='Normalized Count',  # Use the normalized count for plotting
    figsize=(16, 10), 
    x_range=[1, 53],
    title='Genre Popularity by Weekly Charts Over the Year',
    ylabelsize=12, 
    xlabelsize=12,
    range_style='all',  # Ensuring all plots use the same scale
    ylim='own',  # Each plot uses its own y-axis limits based on the normalized data
    color=[genre_to_color[genre] for genre in top_genre_week_counts['Genre'].unique()],  # Apply the random colors
)

# Save the plot as a PNG image
plt.savefig('ridgeline_plot.png', dpi=300)  # Save as PNG to view
plt.savefig('ridgeline_plot.svg', format='svg')  # save as svg to display on the site
