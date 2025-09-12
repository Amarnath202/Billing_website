# Billing Software System

A comprehensive MERN stack billing and inventory management system designed for businesses to manage products, sales, purchases, customers, suppliers, and financial transactions with advanced reporting capabilities.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Product Management** - Complete product catalog with barcode support, categories, and brands
- **Inventory Management** - Real-time stock tracking across multiple warehouses
- **Sales Management** - Sales orders, invoicing, and sales returns
- **Purchase Management** - Purchase orders, supplier management, and purchase returns
- **Customer & Supplier Management** - Complete contact management system
- **Financial Tracking** - Account payables, receivables, and cash flow management

### Advanced Features
- **Barcode Generation & Scanning** - Automatic barcode generation and QR code scanning
- **PDF Generation** - Professional invoices and reports with PDFKit
- **Email Integration** - Automated email notifications and history tracking
- **Excel Export/Import** - Data import/export capabilities with XLSX support
- **Multi-warehouse Support** - Manage inventory across multiple locations
- **Comprehensive Reporting** - Financial reports, sales analytics, and inventory reports
- **Dashboard Analytics** - Real-time business insights with interactive charts

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer for handling file uploads
- **PDF Generation**: PDFKit for invoice and report generation
- **Barcode**: JSBarcode for barcode generation
- **Email**: Nodemailer for email functionality
- **Excel Processing**: XLSX for spreadsheet operations
- **Validation**: Express-validator for input validation

### Frontend
- **Framework**: React.js 18 with functional components and hooks
- **Routing**: React Router DOM v6
- **UI Library**: Material-UI (MUI) v5 with custom theming
- **State Management**: React Context API
- **HTTP Client**: Axios for API communication
- **Charts**: Recharts for data visualization
- **Notifications**: React Hot Toast
- **PDF Generation**: jsPDF with autoTable plugin
- **Barcode**: JSBarcode and HTML5-QRCode for scanning
- **Date Handling**: date-fns library
- **Icons**: React Icons and MUI Icons

## 📁 Project Structure

```
Billing-Software/
├── backend/                    # Node.js/Express backend
│   ├── controllers/           # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── migrations/           # Database migrations
│   ├── models/              # Mongoose models
│   │   ├── User.js          # User management
│   │   ├── Product.js       # Product catalog
│   │   ├── Customer.js      # Customer management
│   │   ├── Supplier.js      # Supplier management
│   │   ├── SalesOrder.js    # Sales transactions
│   │   ├── Purchase.js      # Purchase transactions
│   │   ├── Warehouse.js     # Warehouse management
│   │   └── ...              # Other models
│   ├── routes/              # API routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── products.js      # Product management
│   │   ├── sales.js         # Sales operations
│   │   ├── purchases.js     # Purchase operations
│   │   ├── reports.js       # Reporting endpoints
│   │   └── ...              # Other route files
│   ├── scripts/             # Utility scripts
│   ├── uploads/             # File upload directory
│   ├── .env                 # Environment variables
│   ├── app.js               # Express app configuration
│   ├── server.js            # Server entry point
│   └── package.json         # Backend dependencies
│
├── frontend/                   # React.js frontend
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── api/              # API service functions
│   │   ├── components/       # Reusable React components
│   │   ├── contexts/         # React Context providers
│   │   │   ├── AuthContext.js        # Authentication context
│   │   │   ├── ThemeContext.js       # Theme management
│   │   │   └── AppSettingsContext.js # App settings
│   │   ├── pages/            # Page components
│   │   │   ├── Auth/         # Login/Register pages
│   │   │   ├── Dashboard.js  # Main dashboard
│   │   │   ├── Items/        # Product management
│   │   │   ├── Sales/        # Sales management
│   │   │   ├── Purchases/    # Purchase management
│   │   │   ├── Contacts/     # Customer/Supplier management
│   │   │   ├── Reports/      # Reporting pages
│   │   │   ├── Settings/     # Application settings
│   │   │   └── ...           # Other page components
│   │   ├── services/         # Business logic services
│   │   ├── styles/           # CSS and styling
│   │   ├── utils/            # Utility functions
│   │   ├── App.js            # Main App component
│   │   ├── AppRoutes.js      # Route configuration
│   │   └── index.js          # React entry point
│   ├── .env                  # Frontend environment variables
│   └── package.json          # Frontend dependencies
│
├── package.json               # Root package.json for scripts
└── README.md                 # This file
```

## 🚦 Getting Started

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Billing-Software
```

2. **Install all dependencies**
```bash
npm run install-all
```

This command will install dependencies for the root, backend, and frontend directories.

### Environment Configuration

#### Backend Environment (.env in backend folder)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/billing-system

# Server
PORT=5001
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

#### Frontend Environment (.env in frontend folder)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_BASE_URL=http://localhost:3000

# App Configuration
REACT_APP_NAME=Billing System
REACT_APP_VERSION=1.0.0
```

### Running the Application

#### Development Mode
```bash
# Start both backend and frontend concurrently
npm start

# Or start individually:
# Backend only
npm run server

# Frontend only
npm run client
```

#### Production Mode
```bash
# Backend
cd backend
npm start

# Frontend (build and serve)
cd frontend
npm run build
# Serve the build folder with your preferred web server
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Documentation**: http://localhost:5001/api/routes

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Product Management
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales Management
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get sale by ID
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Purchase Management
- `GET /api/purchases` - Get all purchases
- `POST /api/purchases` - Create new purchase
- `GET /api/purchases/:id` - Get purchase by ID
- `PUT /api/purchases/:id` - Update purchase
- `DELETE /api/purchases/:id` - Delete purchase

### Financial Management
- `GET /api/account-payable` - Account payables
- `GET /api/account-receivable` - Account receivables
- `GET /api/cash-in-hand*` - Cash management endpoints
- `GET /api/cash-in-bank*` - Bank account management
- `GET /api/cash-in-cheque*` - Cheque management

### Reporting
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/purchases` - Purchase reports
- `GET /api/reports/inventory` - Inventory reports
- `GET /api/reports/financial` - Financial reports

### Utility
- `GET /api/barcode/generate` - Generate barcode
- `POST /api/email/send` - Send email
- `GET /api/migration` - Database migration tools

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Different permission levels for users
- **Password Hashing** - bcryptjs for secure password storage
- **Input Validation** - Express-validator for API input validation
- **CORS Protection** - Configured CORS for secure cross-origin requests
- **Environment Variables** - Sensitive data stored in environment variables

## 📱 User Interface Features

- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Dark/Light Theme** - Toggle between themes
- **Material Design** - Modern UI with Material-UI components
- **Interactive Charts** - Real-time data visualization
- **Toast Notifications** - User-friendly feedback messages
- **Loading States** - Smooth user experience with loading indicators
- **Error Boundaries** - Graceful error handling

## 🗄️ Database Schema

### Key Models
- **Users** - User accounts with role-based permissions
- **Products** - Product catalog with barcode and inventory tracking
- **Customers/Suppliers** - Contact management
- **Sales/Purchases** - Transaction records
- **Warehouses** - Multi-location inventory management
- **Brands/Categories** - Product organization
- **Financial Records** - Account payables, receivables, cash flow

## 📈 Reporting & Analytics

- **Sales Analytics** - Revenue trends, top products, customer insights
- **Inventory Reports** - Stock levels, low stock alerts, warehouse analytics
- **Financial Reports** - Profit/loss, cash flow, account summaries
- **Export Options** - PDF and Excel export for all reports

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables for production
3. Deploy to your preferred hosting service (Heroku, AWS, DigitalOcean)
4. Ensure proper CORS configuration for your frontend domain

### Frontend Deployment
1. Update API URL in environment variables
2. Build the production version: `npm run build`
3. Deploy the build folder to your web hosting service
4. Configure proper routing for single-page application

### Docker Deployment (Optional)
```dockerfile
# Example Dockerfile for backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the package.json files for details.

## 🆘 Support & Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env file
   - Verify network connectivity

2. **Port Already in Use**
   - Change PORT in backend .env file
   - Kill existing processes using the port

3. **CORS Errors**
   - Verify frontend URL in backend CORS configuration
   - Check API URL in frontend .env file

### Getting Help
- Check the console logs for detailed error messages
- Ensure all environment variables are properly configured
- Verify all dependencies are installed correctly

## 🔄 Version History

- **v1.0.0** - Initial release with core billing functionality
- Features include user management, product catalog, sales/purchase management, and basic reporting

## 🎯 Future Enhancements

- Mobile application (React Native)
- Advanced analytics and forecasting
- Multi-currency support
- Integration with payment gateways
- Automated backup and restore
- Advanced user permissions and workflows
- API rate limiting and caching
- Real-time notifications with WebSocket

---

**Built with ❤️ using the MERN Stack**