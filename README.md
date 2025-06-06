<div align="center">

<h1>BharatGraph</h1>

*An open-source project providing public API and visual reporesentation of Indian stock market companies*

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Open Source](https://img.shields.io/badge/Open%20Source-API-2ea44f?style=for-the-badge&logo=github)](https://api.bharatgraph.byvaibhav.com)

</div>

## 🌟 Overview

BharatGraph is a cutting-edge financial data visualization and analysis platform that provides comprehensive insights into the Indian financial markets. With data from **4,907 exchange companies**, BharatGraph offers an unprecedented depth of market intelligence, making it an essential tool for investors, analysts, and financial professionals.

For years, accessing comprehensive Indian stock market data has been a significant challenge for developers, researchers, and investors. Many had to rely on expensive paid services or incomplete datasets. BharatGraph changes this landscape by providing **free and open access** to this valuable data through our public API, making Indian market data accessible to everyone. This achievement was made possible through years of dedicated data collection, extensive web scraping, and careful processing of market data.

## ✨ Key Features

- **Lightning-Fast Search**: Our advanced search engine provides instant results across all 4,907 companies with intelligent filtering, fuzzy matching, and real-time suggestions
- **Free Public Dataset**: Access our comprehensive dataset with just click of a download button, no subscription or authentication required
- **Comprehensive Data Coverage**: Access real-time and historical data from 4,907 exchange companies
- **Advanced Visualization**: Interactive charts and graphs for market analysis
- **Real-time Updates**: Live market data and price movements
- **No Authentication Required**: No subscription charge or authentication required
- **Multiple Data Formats**: JSON, CSV, and Excel exports

## 📡 Public API

BharatGraph offers a **free public API** to access company data easily without any authentication or subscription.

### API Endpoints

- `GET /api/company`  
  Returns the complete list of all 4,907 companies.

- `GET /api/company?name=<company_name>`  
  Search companies by partial or full company name (case-insensitive).

- `GET /api/company?nse=<NSE_symbol>`  
  Search a company by its NSE ticker symbol.

- `GET /api/company?bse=<BSE_symbol>`  
  Search a company by its BSE ticker symbol.

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: D3.JS Bubble

## 🚀 Contribute

### Prerequisites

- Node.js 18.x or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mr-vaibh/bharatgraph.git
   cd bharatgraph/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Data Coverage

BharatGraph provides comprehensive coverage of the Indian financial markets:

- **Stock Exchanges**: NSE, BSE
- **Companies**: 4,907 listed companies
- **Data Provided**:
    - Company Name & Type
    - Ticker Symbol - NSE & BSE
    - Market Capital
    - Sector & Industry, 

## 🏗️ Data Collection

The comprehensive dataset of 4,907 companies was made possible through:

- **Extensive Web Scraping**: Years of dedicated data collection from multiple sources
- **Data Processing Pipeline**: Custom-built ETL processes for data cleaning and normalization
- **Quality Assurance**: Rigorous validation and verification of all data points
- **Regular Updates**: Automated systems for daily data refresh

## 🤝 Contributing

We welcome contributions to BharatGraph! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please:
- Open an issue in the GitHub repository
- Contact: shuklavaibhav336@gmail.com

---

<div align="center">

Made with ❤️ in India

*Empowering the Indian financial community with open data*

</div>
