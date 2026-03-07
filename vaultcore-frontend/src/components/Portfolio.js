// frontend/src/components/Portfolio.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { STOCKS_URL } from '../config/api';

// ✅ Format as Indian Rupees: ₹1,00,000.00
const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', minimumFractionDigits: 2
    }).format(amount);

// ✅ Custom tooltip for chart showing ₹ instead of $
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border rounded p-2 shadow-sm">
                <p className="mb-0 small text-muted">{label}</p>
                <p className="mb-0 fw-bold text-primary">{formatINR(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

function Portfolio() {
    const [stocks,        setStocks]        = useState([]);
    const [selectedStock, setSelectedStock] = useState('AAPL');
    const [stockData,     setStockData]     = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState('');

    useEffect(() => { fetchStocks(); }, []);

    useEffect(() => {
        if (!selectedStock) return;
        fetchStockPrice(selectedStock);
        const interval = setInterval(() => fetchStockPrice(selectedStock), 5000);
        return () => clearInterval(interval);
    }, [selectedStock]);

    const fetchStocks = async () => {
        try {
            const response = await axios.get(STOCKS_URL, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const stocksList = Object.entries(response.data).map(([symbol, price]) => ({ symbol, price }));
            setStocks(stocksList);
            if (stocksList.length > 0) setSelectedStock(stocksList[0].symbol);
        } catch (err) {
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
                    time:  new Date().toLocaleTimeString('en-IN'),
                    price: response.data.price
                }];
                return newData.length > 20 ? newData.slice(newData.length - 20) : newData;
            });
        } catch (err) {
            console.error('Error fetching stock price:', err);
        }
    };

    if (loading) return (
        <div className="text-center mt-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading stocks...</p>
        </div>
    );

    const latestPrice = stockData.length > 0 ? stockData[stockData.length - 1].price : null;
    const prevPrice   = stockData.length > 1 ? stockData[stockData.length - 2].price : null;
    const priceChange = latestPrice && prevPrice ? latestPrice - prevPrice : 0;
    const isUp        = priceChange >= 0;

    return (
        <div>
            <h2>📈 Stock Portfolio</h2>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            <div className="row mt-4">
                {/* Stock List */}
                <div className="col-md-4">
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h5 className="mb-0">Available Stocks</h5>
                            <small className="text-muted">Prices in ₹ (INR)</small>
                        </div>
                        <div className="card-body p-0">
                            <div className="list-group list-group-flush">
                                {stocks.map(stock => (
                                    <button
                                        key={stock.symbol}
                                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center
                                            ${selectedStock === stock.symbol ? 'active' : ''}`}
                                        onClick={() => { setStockData([]); setSelectedStock(stock.symbol); }}
                                    >
                                        <div>
                                            <div className="fw-bold">{stock.symbol}</div>
                                        </div>
                                        {/* ✅ INR price badge */}
                                        <span className={`badge rounded-pill ${selectedStock === stock.symbol ? 'bg-white text-primary' : 'bg-primary'}`}>
                                            {formatINR(stock.price)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="col-md-8">
                    <div className="card shadow-sm">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0">{selectedStock} Price Chart</h5>
                                <small className="text-muted">Live updates every 5 seconds • Prices in ₹</small>
                            </div>
                            {/* ✅ Live price display in INR */}
                            {latestPrice && (
                                <div className="text-end">
                                    <div className="fw-bold fs-5">{formatINR(latestPrice)}</div>
                                    <small className={isUp ? 'text-success' : 'text-danger'}>
                                        {isUp ? '▲' : '▼'} {formatINR(Math.abs(priceChange))}
                                    </small>
                                </div>
                            )}
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
                                        <XAxis dataKey="time" tick={{fontSize: 11}} />
                                        {/* ✅ Y-axis formatted as INR */}
                                        <YAxis
                                            tickFormatter={(v) => `₹${v.toFixed(0)}`}
                                            domain={['auto', 'auto']}
                                            tick={{fontSize: 11}}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            name={`${selectedStock} (₹)`}
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
