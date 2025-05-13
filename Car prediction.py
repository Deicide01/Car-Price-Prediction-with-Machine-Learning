import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import warnings
warnings.filterwarnings('ignore')


plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette('viridis')


print("Loading and exploring data...")
df = pd.read_csv('sales.csv')


print(f"Dataset shape: {df.shape}")
print("\nFirst 5 rows:")
print(df.head())


print("\nSummary statistics:")
print(df.describe())


print("\nMissing values:")
print(df.isnull().sum())


plt.figure(figsize=(10, 6))
sns.histplot(df['Selling_Price'], kde=True)
plt.title('Distribution of Selling Price')
plt.xlabel('Selling Price (lakhs)')
plt.ylabel('Frequency')
plt.savefig('selling_price_distribution.png')
plt.close()


print("\nPerforming data preprocessing...")


df['Car_Age'] = 2025 - df['Year']
df = df.drop(['Year'], axis=1)


df['Brand'] = df['Car_Name'].apply(lambda x: x.split()[0])
df = df.drop(['Car_Name'], axis=1)


categorical_cols = ['Fuel_Type', 'Selling_type', 'Transmission', 'Brand']
df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

print("\nProcessed dataframe head:")
print(df_encoded.head())


X = df_encoded.drop('Selling_Price', axis=1)
y = df_encoded['Selling_Price']


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"\nTraining set: {X_train.shape[0]} samples")
print(f"Test set: {X_test.shape[0]} samples")


print("\nTraining Random Forest model...")
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)


y_pred = model.predict(X_test)


r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mae = mean_absolute_error(y_test, y_pred)

print(f"\nModel performance:")
print(f"R² Score: {r2:.3f}")
print(f"Root Mean Squared Error: {rmse:.3f} lakhs")
print(f"Mean Absolute Error: {mae:.3f} lakhs")


print("\nAnalyzing feature importance...")
importances = model.feature_importances_
feat_names = X.columns
feat_imp = pd.Series(importances, index=feat_names).sort_values(ascending=False)


print("\nTop 10 most important features:")
print(feat_imp.head(10))


plt.figure(figsize=(12, 8))
feat_imp_plot = feat_imp.head(15).sort_values(ascending=True)
sns.barplot(x=feat_imp_plot.values, y=feat_imp_plot.index)
plt.title('Top 15 Feature Importances - Random Forest', fontsize=14)
plt.xlabel('Importance Score', fontsize=12)
plt.tight_layout()
plt.savefig('feature_importance.png')
plt.close()


plt.figure(figsize=(10, 8))
plt.scatter(y_test, y_pred, alpha=0.6)
lims = [0, max(y_test.max(), y_pred.max())+1]
plt.plot(lims, lims, '--r')
plt.xlabel('Actual Selling Price (lakhs)', fontsize=12)
plt.ylabel('Predicted Price (lakhs)', fontsize=12)
plt.title('Actual vs Predicted Prices', fontsize=14)
plt.tight_layout()
plt.savefig('actual_vs_predicted.png')
plt.close()


sample = X_test.iloc[:10]
sample_actual = y_test.iloc[:10].values
sample_preds = model.predict(sample)
comparison = pd.DataFrame({
    'Actual_Price': sample_actual,
    'Predicted_Price': sample_preds,
    'Difference': sample_actual - sample_preds
})
print("\nExample predictions:")
print(comparison.round(2))


def predict_car_price(model, car_info):
    """
    Predict car price based on provided features
    
    Parameters:
    model: Trained model
    car_info: Dictionary with car features
    
    Returns:
    Predicted price
    """
    
    input_df = pd.DataFrame([car_info])
    
    
    if 'Year' in input_df.columns:
        input_df['Car_Age'] = 2025 - input_df['Year']
        input_df = input_df.drop(['Year'], axis=1)
    
    if 'Car_Name' in input_df.columns:
        input_df['Brand'] = input_df['Car_Name'].apply(lambda x: x.split()[0])
        input_df = input_df.drop(['Car_Name'], axis=1)
    
    
    input_encoded = pd.get_dummies(input_df)
    
    
    for col in X.columns:
        if col not in input_encoded.columns:
            input_encoded[col] = 0
    
    
    input_encoded = input_encoded[X.columns]
    
    
    return model.predict(input_encoded)[0]


example_car = {
    'Present_Price': 10.0,
    'Driven_kms': 25000,
    'Fuel_Type': 'Petrol',
    'Selling_type': 'Dealer',
    'Transmission': 'Manual',
    'Owner': 0,
    'Car_Age': 3  
}

print("\nPrediction for example car:")

print("\nAnalysis complete!")