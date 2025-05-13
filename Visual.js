import React, { useState, useEffect } from 'react';
import { PaperParser } from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

export default function CarPricePredictionApp() {
  const [data, setData] = useState([]);
  const [processedData, setProcessedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [formData, setFormData] = useState({
    carAge: 3,
    kms: 30000,
    presentPrice: 10,
    fuelType: 'Petrol',
    sellerType: 'Dealer',
    transmission: 'Manual',
    owner: 0
  });
  
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await window.fs.readFile('car data.csv', { encoding: 'utf8' });
        
        
        Papa.parse(response, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data);
            processData(results.data);
            setLoading(false);
          },
          error: (error) => {
            setError(`Error parsing CSV: ${error}`);
            setLoading(false);
          }
        });
      } catch (err) {
        setError(`Error loading data: ${err}`);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const processData = (rawData) => {
    const withAge = rawData.map(car => ({
      ...car,
      Car_Age: 2025 - car.Year
    }));
    
    const priceByAge = _.chain(withAge)
      .groupBy('Car_Age')
      .map((group, age) => ({
        age: parseInt(age),
        avgPrice: _.meanBy(group, 'Selling_Price'),
        count: group.length
      }))
      .filter(item => item.count > 2) 
      .sortBy('age')
      .value();
      
    
    const priceByFuel = _.chain(withAge)
      .groupBy('Fuel_Type')
      .map((group, type) => ({
        fuelType: type,
        avgPrice: _.meanBy(group, 'Selling_Price'),
        count: group.length
      }))
      .value();
      
    
    const priceByTransmission = _.chain(withAge)
      .groupBy('Transmission')
      .map((group, type) => ({
        transmission: type,
        avgPrice: _.meanBy(group, 'Selling_Price'),
        count: group.length
      }))
      .value();
      
    
    const scatterData = withAge.map(car => ({
      x: car.Car_Age,
      y: car.Selling_Price,
      z: car.Driven_kms / 10000, 
      name: car.Car_Name
    }));
    
    setProcessedData({
      priceByAge,
      priceByFuel,
      priceByTransmission,
      scatterData
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'carAge' || name === 'kms' || name === 'presentPrice' || name === 'owner' 
        ? parseFloat(value) 
        : value
    });
  };
  
  const predictPrice = () => {
    
    const similarCars = data.filter(car => {
      const carAge = 2025 - car.Year;
      return (
        Math.abs(carAge - formData.carAge) <= 2 &&
        car.Fuel_Type === formData.fuelType &&
        car.Transmission === formData.transmission
      );
    });
    
    if (similarCars.length === 0) {
      setPredictions([{
        method: "No similar cars found",
        price: 0
      }]);
      return;
    }
    
    
    const avgPrice = _.meanBy(similarCars, 'Selling_Price');
    
    const avgRatio = _.meanBy(similarCars, car => car.Selling_Price / car.Present_Price);
    const ratioPrediction = formData.presentPrice * avgRatio;
    
    const ageDepreciation = 1 - (formData.carAge * 0.08);
    const ageBasedPrice = formData.presentPrice * ageDepreciation;
    
    const kmsDepreciation = 1 - (formData.kms / 150000);
    const kmsAdjustedPrice = ageBasedPrice * Math.max(0.5, kmsDepreciation);
    
    setPredictions([
      { method: "Similar Cars Average", price: avgPrice },
      { method: "Price Ratio Method", price: ratioPrediction },
      { method: "Age & Mileage Based", price: kmsAdjustedPrice }
    ]);
  };

  if (loading) return <div className="p-4 text-center">Loading car data...</div>;
  if (error) return <div className="p-4 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Car Price Prediction</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Car Price Analysis</h2>
          
          {processedData && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Price by Car Age</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={processedData.priceByAge}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" label={{ value: 'Car Age (years)', position: 'insideBottom', offset: 0 }} />
                    <YAxis label={{ value: 'Average Price (lakhs)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`₹${value.toFixed(2)} lakhs`, 'Average Price']} />
                    <Bar dataKey="avgPrice" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Price by Fuel Type</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={processedData.priceByFuel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fuelType" />
                    <YAxis label={{ value: 'Average Price (lakhs)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`₹${value.toFixed(2)} lakhs`, 'Average Price']} />
                    <Bar dataKey="avgPrice" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
        
        {/* Prediction Form Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Predict Car Price</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Car Age (years)</label>
              <input
                type="number"
                name="carAge"
                value={formData.carAge}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                max="25"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Kilometers Driven</label>
              <input
                type="number"
                name="kms"
                value={formData.kms}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Present Price (lakhs)</label>
              <input
                type="number"
                name="presentPrice"
                value={formData.presentPrice}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Fuel Type</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Seller Type</label>
              <select
                name="sellerType"
                value={formData.sellerType}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="Dealer">Dealer</option>
                <option value="Individual">Individual</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Transmission</label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Previous Owners</label>
              <select
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="0">0 (First Owner)</option>
                <option value="1">1 (Second Owner)</option>
                <option value="2">2 (Third Owner)</option>
                <option value="3">3 (Fourth Owner)</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={predictPrice}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Predict Price
          </button>
          
          {predictions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Price Predictions</h3>
              <div className="bg-gray-100 p-4 rounded">
                {predictions.map((pred, index) => (
                  <div key={index} className="flex justify-between mb-2">
                    <span>{pred.method}:</span>
                    <span className="font-semibold">
                      {pred.price > 0 ? `₹${pred.price.toFixed(2)} lakhs` : 'N/A'}
                    </span>
                  </div>
                ))}
                
                <div className="mt-4 pt-2 border-t border-gray-300">
                  <div className="flex justify-between">
                    <span className="font-semibold">Estimated Price Range:</span>
                    <span className="font-bold text-blue-600">
                      {predictions[0].price > 0 
                        ? `₹${Math.min(...predictions.map(p => p.price)).toFixed(2)} - ₹${Math.max(...predictions.map(p => p.price)).toFixed(2)} lakhs`
                        : 'Not enough data'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Scatter Plot Section */}
      {processedData && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Price vs Age & Kilometers</h2>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name="Age" label={{ value: 'Car Age (years)', position: 'insideBottom', offset: 0 }} />
              <YAxis type="number" dataKey="y" name="Price" label={{ value: 'Selling Price (lakhs)', angle: -90, position: 'insideLeft' }} />
              <ZAxis type="number" dataKey="z" range={[20, 200]} name="Kilometers" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => {
                if (name === 'Price') return [`₹${value.toFixed(2)} lakhs`, name];
                if (name === 'Age') return [value, name];
                if (name === 'Kilometers') return [`${(value * 10000).toLocaleString()} km`, name];
                return [value, name];
              }} />
              <Scatter name="Cars" data={processedData.scatterData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}