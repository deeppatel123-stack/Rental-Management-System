import RentalOrder from '../models/RentalOrder.js';
import Product from '../models/Product.js';
import Deposit from '../models/Deposit.js';
import User from '../models/User.js';
import { predictRevenue, getPredictiveMaintenance, getDemandForecasting } from '../services/aiService.js';

export const getDashboardStats = async (req, res, next) => {
    try {
        const now = new Date();
        const isPartner = req.user?.role === 'Rental Partner';
        const ownerQuery = isPartner ? { ownerId: req.user.id } : {};

        // 1. Paid orders filter
        const paidOrders = await RentalOrder.find({ paymentStatus: 'Paid', ...ownerQuery });
        const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount - o.securityDepositTotal), 0);

        // 2. Today's orders
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayOrders = await RentalOrder.find({
            paymentStatus: 'Paid',
            createdAt: { $gte: startOfDay },
            ...ownerQuery
        });
        const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount - o.securityDepositTotal), 0);

        // 3. Rentals counters
        const totalRentalsCount = await RentalOrder.countDocuments(ownerQuery);
        const activeRentalsCount = await RentalOrder.countDocuments({ status: 'Active', ...ownerQuery });

        // 4. Overdue
        const overdueCount = await RentalOrder.countDocuments({
            status: { $in: ['Active', 'Picked Up'] },
            endDate: { $lt: now },
            ...ownerQuery
        });

        // 5. Deposits
        const depositsHeld = await Deposit.find({ status: 'Held', ...ownerQuery });
        const totalDepositsHeldAmount = depositsHeld.reduce((sum, d) => sum + d.amountHeld, 0);
        const pendingRefundsCount = await Deposit.countDocuments({ status: 'Processing', ...ownerQuery });

        // 6. Monthly chart breakdown
        const monthlyRevenue = {};
        const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const monthStr = `${monthsName[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
            monthlyRevenue[monthStr] = 0;
        }

        paidOrders.forEach(o => {
            const date = new Date(o.createdAt);
            const key = `${monthsName[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
            if (monthlyRevenue[key] !== undefined) {
                monthlyRevenue[key] += (o.totalAmount - o.securityDepositTotal);
            }
        });

        const monthlyRevenueChartData = Object.keys(monthlyRevenue).reverse().map(key => ({
            name: key,
            revenue: Math.round(monthlyRevenue[key] * 100) / 100
        }));

        // 7. Products and Activities
        const products = await Product.find(ownerQuery).limit(5);
        const recentOrders = await RentalOrder.find(ownerQuery)
            .populate('customer', 'name')
            .limit(6)
            .sort({ createdAt: -1 });

        const recentActivities = recentOrders.map(o => ({
            id: o._id,
            customerName: o.customer ? o.customer.name : 'Guest Customer',
            orderNumber: o.orderNumber,
            total: o.totalAmount,
            status: o.status,
            date: o.createdAt
        }));

        // AI forecasts
        const revenuePredictions = await predictRevenue();
        const predictiveMaintenanceList = await getPredictiveMaintenance();
        const demandForecasts = await getDemandForecasting();

        // 8. Staff-wise Admin Oversight Reports
        let staffReports = [];
        if (req.user?.role === 'Super Admin') {
            const staffUsers = await User.find({ role: { $in: ['Rental Partner', 'Super Admin'] } }).select('name email role');
            for (const staff of staffUsers) {
                const staffProductsCount = await Product.countDocuments({ ownerId: staff._id });
                const staffOrders = await RentalOrder.find({ ownerId: staff._id });
                const staffRevenue = staffOrders.reduce((sum, o) => sum + (o.totalAmount - o.securityDepositTotal), 0);
                const staffDeposits = staffOrders.reduce((sum, o) => sum + o.securityDepositTotal, 0);
                const staffReturns = staffOrders.filter(o => o.status === 'Returned').length;
                const staffPending = staffOrders.filter(o => o.status === 'Pending').length;

                staffReports.push({
                    staffId: staff._id,
                    name: staff.name,
                    email: staff.email,
                    role: staff.role,
                    productsCount: staffProductsCount,
                    ordersCount: staffOrders.length,
                    revenue: Math.round(staffRevenue * 100) / 100,
                    deposits: Math.round(staffDeposits * 100) / 100,
                    returns: staffReturns,
                    pending: staffPending
                });
            }
        }

        res.json({
            success: true,
            stats: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                todayRevenue: Math.round(todayRevenue * 100) / 100,
                totalRentals: totalRentalsCount,
                activeRentals: activeRentalsCount,
                overdueRentals: overdueCount,
                depositsHeld: Math.round(totalDepositsHeldAmount * 100) / 100,
                refundPending: pendingRefundsCount
            },
            charts: {
                monthlyRevenue: monthlyRevenueChartData
            },
            topProducts: products.map(p => ({
                name: p.name,
                category: p.category,
                utilizationRate: 75 + Math.floor(Math.random() * 20),
                revenue: Math.floor(totalRevenue * 0.15)
            })),
            recentActivities,
            staffReports,
            aiForecasts: {
                revenuePredictions,
                predictiveMaintenanceList,
                demandForecasts
            }
        });
    } catch (error) {
        next(error);
    }
};
