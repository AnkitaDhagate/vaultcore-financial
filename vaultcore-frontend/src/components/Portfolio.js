// frontend/src/components/Portfolio.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { STOCKS_URL } from '../config/api';

function Portfolio() {
    const [stocks, setStocks] = useState([]);
    const [selectedStock, setSelectedStock] = useState('AAPL');
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ✅ FIX: Use STOCKS_URL from config (port 8081 instead of 8080)
    useEffect(() => {
        fetchStocks();
    }, []);

    useEffect(() => {
        if (!selectedStock) return;

        fetchStockPrice(selectedStock);

        const interval = setInterval(() => {
            fetchStockPrice(selectedStock);
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedStock]);  // ✅ FIX: Separate effect so interval resets properly on stock change

    const fetchStocks = async () => {
        try {
            const response = await axios.get(STOCKS_URL, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            const stocksList = Object.entries(response.data).map(([symbol, price]) => ({
                symbol,
                price
            }));
            setStocks(stocksList);

            if (stocksList.length > 0) {
                setSelectedStock(stocksList[0].symbol);
            }
        } catch (err) {
            console.error('Error fetching stocks:', err);
            setError('Failed to load stocks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStockPrice = async (symbol) => {
        try {
            const response = await axios.get(`${STOCKS_URL}/${symbol}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setStockData(prev => {
                const newData = [...prev, {
                    time: new Date().toLocaleTimeString(),
                    price: response.data.price
                }];
                return newData.length > 20 ? newData.slice(newData.length - 20) : newData;
            });
        } catch (err) {
            console.error('Error fetching stock price:', err);
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading stocks...</p>
            </div>
        );
    }

    return (
        <div>
            <h2>Stock Portfolio</h2>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            <div className="row mt-4">
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h5>Available Stocks</h5>
                        </div>
                        <div className="card-body">
                            <div className="list-group">
                                {stocks.map(stock => (
                                    <button
                                        key={stock.symbol}
                                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedStock === stock.symbol ? 'active' : ''}`}
                                        onClick={() => {
                                            setStockData([]); // ✅ Clear chart when switching stocks
                                            setSelectedStock(stock.symbol);
                                        }}
                                    >
                                        {stock.symbol}
                                        <span className="badge bg-primary rounded-pill">
                                            ${stock.price.toFixed(2)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <h5>{selectedStock} Price Chart</h5>
                            <small className="text-muted">Live updates every 5 seconds</small>
                        </div>
                        <div className="card-body">
                            {stockData.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <div className="spinner-border spinner-border-sm me-2"></div>
                                    Fetching live price data...
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={stockData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" />
                                        <YAxis domain={['auto', 'auto']} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#8884d8"
                                            name={selectedStock}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Portfolio;
