import warnings
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import glob
from google.colab import files
from collections import defaultdict

# Suppress specific warnings
warnings.filterwarnings("ignore", category=pd.errors.PerformanceWarning)

# Save file paths for uploaded files
file_paths = glob.glob('/content/Files/*.json')

# Load training data from multiple JSON files
dataframes = []
for file_path in file_paths:
    with open(file_path, 'r') as f:
        data = json.load(f)
    dataframes.append(pd.DataFrame(data))

df = pd.concat(dataframes, ignore_index=True)

# Check for missing values
print(df.isnull().sum())

# Identify columns with mixed data types
for col in df.columns:
    if df[col].apply(type).nunique() > 1:
        print(f"Column '{col}' has mixed data types.")

# Handle mixed data types
for col in df.columns:
    if df[col].apply(type).nunique() > 1:
        df[col] = df[col].astype(str)

# Fill missing values for numeric columns
numeric_cols = df.select_dtypes(include=['number']).columns
df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

# Encode categorical variables
df = pd.get_dummies(df, drop_first=True)

# Normalize numerical features
numerical_features = [
'homeAvgDefAllowedFirstDowns',
'homeAvgDefCreatedFumbles',
'homeAvgDefInterceptions',
'homeAvgDefAllowedPassAttemps',
'homeAvgDefAllowedPassCpm',
'homeAvgDefAllowedPassTD',
'homeAvgDefAllowedPassYD',
'homeAvgDefCreatedPenalties',
'homeAvgDefCreatedPenaltiesYDs',
'homeAvgDefAllowedPointsQ1',
'homeAvgDefAllowedPointsQ2',
'homeAvgDefAllowedPointsQ3',
'homeAvgDefAllowedPointsQ4',
'homeAvgDefAllowedRushAttemps',
'homeAvgDefAllowedRushTD',
'homeAvgDefAllowedRushYD',
'homeAvgDefAllowedTotalYD',
'homeAvgDefTurnovers',
'homeAvgOffenseFirstDowns',
'homeAvgOffenseCreatedFumbles',
'homeAvgOffenseInterceptions',
'homeAvgOffensePassAttemps',
'homeAvgOffensePassCpm',
'homeAvgOffensePassTD',
'homeAvgOffensePassYD',
'homeAvgOffenseCreatedPenalties',
'homeAvgOffenseCreatedPenaltiesYDs',
'homeAvgOffensePointsQ1',
'homeAvgOffensePointsQ2',
'homeAvgOffensePointsQ3',
'homeAvgOffensePointsQ4',
'homeAvgOffenseRushAttemps',
'homeAvgOffenseRushTD',
'homeAvgOffenseRushYD',
'homeAvgOffenseTotalYD',
'homeAvgOffenseTurnovers',
'awayAvgDefAllowedFirstDowns',
'awayAvgDefCreatedFumbles',
'awayAvgDefInterceptions',
'awayAvgDefAllowedPassAttemps',
'awayAvgDefAllowedPassCpm',
'awayAvgDefAllowedPassTD',
'awayAvgDefAllowedPassYD',
'awayAvgDefCreatedPenalties',
'awayAvgDefCreatedPenaltiesYDs',
'awayAvgDefAllowedPointsQ1',
'awayAvgDefAllowedPointsQ2',
'awayAvgDefAllowedPointsQ3',
'awayAvgDefAllowedPointsQ4',
'awayAvgDefAllowedRushAttemps',
'awayAvgDefAllowedRushTD',
'awayAvgDefAllowedRushYD',
'awayAvgDefAllowedTotalYD',
'awayAvgDefTurnovers',
'awayAvgOffenseFirstDowns',
'awayAvgOffenseCreatedFumbles',
'awayAvgOffenseInterceptions',
'awayAvgOffensePassAttemps',
'awayAvgOffensePassCpm',
'awayAvgOffensePassTD',
'awayAvgOffensePassYD',
'awayAvgOffenseCreatedPenalties',
'awayAvgOffenseCreatedPenaltiesYDs',
'awayAvgOffensePointsQ1',
'awayAvgOffensePointsQ2',
'awayAvgOffensePointsQ3',
'awayAvgOffensePointsQ4',
'awayAvgOffenseRushAttemps',
'awayAvgOffenseRushTD',
'awayAvgOffenseRushYD',
'awayAvgOffenseTotalYD',
'awayAvgOffenseTurnovers',
'awayAvgDefAllowedPoints',
'homeAvgDefAllowedPoints',
'awayAvgOffensePoints',
'homeAvgOffensePoints'
]
scaler = StandardScaler()
df[numerical_features] = scaler.fit_transform(df[numerical_features])

# Define target variables
targets = ['isHomeWinner']

# Dictionary to store models and predictions
models_rf = {}
models_lr = {}
predictions_probs = {}

# Train and save models for each target
for target in targets:
    X = df.drop(targets, axis=1)
    y = df[target]

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Define a RandomForest model
    model_rf = RandomForestClassifier(n_estimators=100, random_state=42)
    model_rf.fit(X_train, y_train)

    # Define a Logistic Regression model
    model_lr = LogisticRegression(max_iter=1000, random_state=42)
    model_lr.fit(X_train, y_train)

    # Save the models
    models_rf[target] = model_rf
    models_lr[target] = model_lr

    # Evaluate the models
    predictions_rf = model_rf.predict(X_test)
    predictions_lr = model_lr.predict(X_test)
    accuracy_rf = accuracy_score(y_test, predictions_rf)
    accuracy_lr = accuracy_score(y_test, predictions_lr)
    print(f'Accuracy for {target} with RandomForest: {accuracy_rf}')
    print(f'Accuracy for {target} with LogisticRegression: {accuracy_lr}')

# Process new JSON data files
new_game_files = glob.glob('/content/NewGames/*.json')

all_results = []
selections = defaultdict(list)

for file_path in new_game_files:
    with open(file_path, 'r') as f:
        new_data = json.load(f)
    new_df = pd.DataFrame(new_data)

    # Save the 'game', 'isHomeWinner', 'isF5HomeWinner', and 'isOver' columns for later use
    game_column = new_df['key'].copy()

    # Ensure the columns exist in new_df before applying get_dummies
    categorical_cols = ['key', 'date', 'homeTeam', 'awayTeam']
    categorical_cols_existing = [col for col in categorical_cols if col in new_df.columns]

    # Get dummy variables for categorical columns in new_df
    new_df = pd.get_dummies(new_df, columns=categorical_cols_existing, drop_first=True)

    # Add missing columns to new_df
    missing_cols = set(X.columns) - set(new_df.columns)
    for col in missing_cols:
        new_df[col] = 0

    # Reorder columns of new_df to match the order in X
    new_X = new_df[X.columns]

    # Normalize numerical features in new_X using the same scaler
    new_X.loc[:, numerical_features] = scaler.transform(new_X[numerical_features])

    # Make predictions for each target
    results = []
    for i in range(len(new_X)):
        result = {
            "file": file_path,
            "key": game_column.iloc[i],
            "predictions": {}
        }
        for target in targets:
            model_rf = models_rf[target]
            model_lr = models_lr[target]

            # Get prediction probabilities from both models
            prediction_prob_rf = model_rf.predict_proba(new_X.iloc[[i]])[0]
            prediction_prob_lr = model_lr.predict_proba(new_X.iloc[[i]])[0]

            # Store both models' predictions
            result["predictions"][target] = {
                "RandomForest": {
                    "prediction": int(np.argmax(prediction_prob_rf)),
                    "probability": float(max(prediction_prob_rf))
                },
                "LogisticRegression": {
                    "prediction": int(np.argmax(prediction_prob_lr)),
                    "probability": float(max(prediction_prob_lr))
                }
            }

            # Check if predictions match and add to selections if they do
            if np.argmax(prediction_prob_rf) == np.argmax(prediction_prob_lr):
                average_probability = (float(max(prediction_prob_rf)) + float(max(prediction_prob_lr))) / 2
                standard_deviation = np.std([float(max(prediction_prob_rf)), float(max(prediction_prob_lr))])
                selection = {
                    "file": file_path,
                    "key": game_column.iloc[i],
                    "target": target,
                    "prediction": int(np.argmax(prediction_prob_rf)),
                    "probability_rf": float(max(prediction_prob_rf)),
                    "probability_lr": float(max(prediction_prob_lr)),
                    "average_probability": average_probability,
                    "standard_deviation": standard_deviation
                }
                selections[file_path].append(selection)

        results.append(result)

    # Append results of the current file to all_results
    all_results.extend(results)

# Sort the selections for each file based on the average of the probabilities in descending order
for file_path in selections:
    selections[file_path] = sorted(selections[file_path], key=lambda x: x['average_probability'], reverse=True)

# Save results to a JSON file
output_file_path = '/content/final_predictions.json'
with open(output_file_path, 'w') as outfile:
    json.dump(all_results, outfile, indent=4)

# Save selections to a JSON file
selections_file_path = '/content/selections.json'
with open(selections_file_path, 'w') as outfile:
    json.dump(selections, outfile, indent=4)

# Print the output file paths
print(f'Results saved to {output_file_path}')
print(f'Selections saved to {selections_file_path}')
