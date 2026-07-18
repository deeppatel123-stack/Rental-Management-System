import SupportTicket from '../models/SupportTicket.js';

export const createTicket = async (req, res, next) => {
    try {
        const { subject, description, category, rentalOrderId } = req.body;
        const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

        const ticket = await SupportTicket.create({
            ticketId,
            customer: req.user.id,
            rentalOrder: rentalOrderId,
            subject,
            description,
            category,
            messages: [{
                sender: req.user.id,
                message: description
            }]
        });

        res.status(201).json({ success: true, message: 'Support ticket registered successfully', ticket });
    } catch (error) {
        next(error);
    }
};

export const getTickets = async (req, res, next) => {
    try {
        const isCustomer = req.user.role === 'Customer';
        const query = isCustomer ? { customer: req.user.id } : {};

        const tickets = await SupportTicket.find(query)
            .populate('customer', 'name email')
            .sort({ updatedAt: -1 });

        res.json({ success: true, count: tickets.length, tickets });
    } catch (error) {
        next(error);
    }
};

export const getTicketById = async (req, res, next) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('customer', 'name email')
            .populate('messages.sender', 'name role');

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        res.json({ success: true, ticket });
    } catch (error) {
        next(error);
    }
};

export const addMessageToTicket = async (req, res, next) => {
    try {
        const { message } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        ticket.messages.push({
            sender: req.user.id,
            message
        });

        
        if (req.user.role !== 'Customer') {
            ticket.status = 'In Progress';
        }

        await ticket.save();
        res.json({ success: true, message: 'Reply sent successfully', ticket });
    } catch (error) {
        next(error);
    }
};

export const updateTicketStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        ticket.status = status;
        await ticket.save();

        res.json({ success: true, message: 'Ticket status updated successfully', ticket });
    } catch (error) {
        next(error);
    }
};
