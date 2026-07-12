# 🚚 TransitOps – Smart Transport Operations Platform

> **An intelligent fleet management platform that digitizes transport operations, streamlines dispatch, automates maintenance workflows, ensures driver compliance, and provides actionable operational insights for modern logistics organizations.**

---

## 📖 Overview

TransitOps is a centralized fleet management solution designed to simplify and automate the complete transport lifecycle. From vehicle registration and driver management to trip dispatching, maintenance scheduling, fuel logging, expense tracking, and analytics, the platform replaces traditional spreadsheets and manual logbooks with a unified digital ecosystem.

The application enforces real-world business rules, minimizes operational inefficiencies, improves fleet utilization, and empowers organizations with data-driven decision-making.

---

## 🎯 Problem Statement

Many logistics companies continue to rely on manual processes for managing their transport operations. This often leads to:

- Vehicle scheduling conflicts
- Underutilized fleet assets
- Missed maintenance schedules
- Expired driver licenses
- Inefficient dispatch planning
- Poor operational visibility
- Inaccurate expense tracking

TransitOps addresses these challenges by providing a centralized platform that automates fleet operations while maintaining data integrity and operational transparency.

---

# ✨ Features

## 🔐 Authentication & Authorization

- Secure Email & Password Authentication
- Role-Based Access Control (RBAC)
- Protected Routes
- Session Management

---

## 🚛 Fleet Management

Manage every vehicle throughout its operational lifecycle.

### Vehicle Registry

- Register new vehicles
- Update vehicle information
- Track vehicle status
- Maintain acquisition details
- Odometer tracking
- Maximum load capacity management

### Vehicle Status

- ✅ Available
- 🚚 On Trip
- 🔧 In Shop
- 🛑 Retired

---

## 👨‍✈️ Driver Management

Maintain complete driver profiles including:

- Driver Information
- License Details
- License Expiry
- Contact Information
- Safety Score
- Availability Status

### Driver Status

- ✅ Available
- 🚚 On Trip
- 🌙 Off Duty
- ⛔ Suspended

---

## 📦 Trip Management

Create and monitor transport assignments.

Each trip contains:

- Source
- Destination
- Assigned Vehicle
- Assigned Driver
- Cargo Weight
- Planned Distance
- Trip Status

### Trip Lifecycle

```text
Draft
   │
   ▼
Dispatched
   │
   ▼
Completed
```

or

```text
Draft
   │
   ▼
Cancelled
```

---

## 🔧 Maintenance Management

Track vehicle maintenance and service history.

Features include:

- Maintenance Logs
- Service Records
- Workshop Tracking
- Vehicle Availability Management

Whenever maintenance is created:

```text
Available
    │
    ▼
In Shop
```

The vehicle automatically becomes unavailable for dispatch.

---

## ⛽ Fuel & Expense Management

Track operational expenses including:

- Fuel Logs
- Fuel Cost
- Maintenance Cost
- Toll Charges
- Miscellaneous Expenses

Automatically calculates:

- Total Operational Cost
- Fuel Consumption
- Running Cost Per Vehicle

---

## 📊 Dashboard & Analytics

Monitor fleet performance through real-time dashboards.

### Key Performance Indicators (KPIs)

- 🚚 Active Vehicles
- ✅ Available Vehicles
- 🔧 Vehicles Under Maintenance
- 📦 Active Trips
- ⏳ Pending Trips
- 👨‍✈️ Drivers On Duty
- 📈 Fleet Utilization
- 💰 Operational Cost
- ⛽ Fuel Efficiency
- 📊 Vehicle ROI

---

# 👥 User Roles

## 🚛 Fleet Manager

Responsible for overall fleet operations.

### Responsibilities

- Manage Fleet Assets
- Track Vehicle Lifecycle
- Schedule Maintenance
- Monitor Fleet Utilization
- Optimize Operational Efficiency

---

## 🚦 Dispatcher

Responsible for daily transport operations.

### Responsibilities

- Create Trips
- Assign Drivers
- Assign Vehicles
- Dispatch Deliveries
- Monitor Active Trips

---

## 🛡 Safety Officer

Responsible for regulatory compliance.

### Responsibilities

- Verify Driver Licenses
- Monitor Safety Scores
- Track License Expiry
- Prevent Invalid Driver Assignments

---

## 💰 Financial Analyst

Responsible for operational insights.

### Responsibilities

- Analyze Fuel Expenses
- Review Maintenance Costs
- Monitor Operational Expenses
- Calculate Vehicle Profitability
- Evaluate ROI

---

# ⚙ Business Rules

TransitOps automatically enforces real-world logistics constraints.

### 🚚 Vehicle Rules

- Vehicle Registration Number must be unique.
- Retired vehicles cannot be dispatched.
- Vehicles under maintenance cannot be dispatched.
- Vehicles already on a trip cannot be assigned again.

---

### 👨‍✈️ Driver Rules

- Drivers with expired licenses cannot be assigned.
- Suspended drivers cannot be assigned.
- Drivers already on a trip cannot be reassigned.

---

### 📦 Cargo Validation

```text
Cargo Weight ≤ Vehicle Capacity
```

Dispatch is allowed only when the cargo weight does not exceed the vehicle's maximum load capacity.

---

### 🔄 Automatic Status Synchronization

**Trip Dispatch**

```text
Vehicle : Available → On Trip

Driver  : Available → On Trip
```

**Trip Completion**

```text
Vehicle : On Trip → Available

Driver  : On Trip → Available
```

**Maintenance Workflow**

```text
Available
    │
    ▼
In Shop
    │
    ▼
Available
```

---

# 📈 Operational Metrics

### Fleet Utilization

```text
(Vehicles On Trip / Total Vehicles) × 100
```

---

### Fuel Efficiency

```text
Distance Travelled / Fuel Consumed
```

---

### Operational Cost

```text
Fuel Cost
+ Maintenance Cost
+ Other Expenses
```

---

### Vehicle ROI

```text
Revenue − (Fuel + Maintenance)
--------------------------------
      Acquisition Cost
```

---

# 🏗 System Workflow

```text
Register Vehicle
        │
        ▼
Register Driver
        │
        ▼
Create Trip
        │
        ▼
Validate Business Rules
        │
        ▼
Dispatch Trip
        │
        ▼
Vehicle Status → On Trip
Driver Status  → On Trip
        │
        ▼
Complete Trip
        │
        ▼
Vehicle Status → Available
Driver Status  → Available
        │
        ▼
Maintenance (If Required)
        │
        ▼
Vehicle → In Shop
        │
        ▼
Maintenance Completed
        │
        ▼
Vehicle → Available
```

---

# 🗄 Database Entities

- 👤 Users
- 🛡 Roles
- 🚚 Vehicles
- 👨‍✈️ Drivers
- 📦 Trips
- 🔧 Maintenance Logs
- ⛽ Fuel Logs
- 💰 Expenses

---

# 🚀 Future Enhancements

- 📍 Live GPS Tracking
- 🗺 Route Optimization
- 🤖 Predictive Maintenance
- 📱 Mobile Application
- 🔔 Push Notifications
- 🌍 Multi-Branch Fleet Support
- 📄 Vehicle Document Management
- 📊 Advanced Analytics Dashboard
- 📧 Automated Email Alerts
- 📈 AI-Based Fleet Insights

---

# 💻 Tech Stack

**Frontend**

- React.js
- Tailwind CSS
- JavaScript

**Backend**

- Node.js
- Express.js

**Database**

- PostgreSQL

**Authentication**

- JWT Authentication
- Role-Based Access Control (RBAC)

---

# 🌟 Why TransitOps?

TransitOps is more than just a fleet management application—it is a smart operational platform built to automate transport workflows, improve fleet utilization, enforce compliance, reduce operational costs, and provide meaningful business insights.

By combining lifecycle management, intelligent validations, and operational analytics, TransitOps enables logistics organizations to make faster, smarter, and more reliable decisions.

---

# 👥 Collaborators

<table>
<tr>
<td align="center">

### 👩‍💼 Kratika Agarwal
**Team Lead**

</td>
<td align="center">

### 👩‍💻 Deepika Sisodia

</td>
<td align="center">

### 👩‍💻 Kirti Chaudhary

</td>
<td align="center">

### 👩‍💻 Mohini Bharti

</td>
</tr>
</table>

---

# 📄 License

This project was developed during a Hackathon for educational and demonstration purposes.

---

<div align="center">

## 🚚 TransitOps

### *Driving Smarter Fleets Through Intelligent Operations.*

⭐ **If you like this project, don't forget to star the repository!**

</div>
