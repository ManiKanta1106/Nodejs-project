const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory database (replace with real database in production)
let examSlots = [
    { 
        id: "s1", 
        examName: "Mathematics – Final", 
        date: "2025-05-12", 
        startTime: "09:00", 
        endTime: "12:00", 
        capacity: 2, 
        bookedStudents: [] 
    },
    { 
        id: "s2", 
        examName: "Physics – Theory", 
        date: "2025-05-12", 
        startTime: "14:00", 
        endTime: "17:00", 
        capacity: 1, 
        bookedStudents: [] 
    },
    { 
        id: "s3", 
        examName: "Data Structures", 
        date: "2025-05-13", 
        startTime: "09:00", 
        endTime: "12:00", 
        capacity: 2, 
        bookedStudents: [] 
    },
    { 
        id: "s4", 
        examName: "Algorithms", 
        date: "2025-05-13", 
        startTime: "18:00", 
        endTime: "21:00", 
        capacity: 1, 
        bookedStudents: [] 
    },
    { 
        id: "s5", 
        examName: "Database Systems", 
        date: "2025-05-14", 
        startTime: "14:00", 
        endTime: "17:00", 
        capacity: 2, 
        bookedStudents: [] 
    },
    { 
        id: "s6", 
        examName: "Operating Systems", 
        date: "2025-05-15", 
        startTime: "09:00", 
        endTime: "12:00", 
        capacity: 1, 
        bookedStudents: [] 
    },
    { 
        id: "s7", 
        examName: "Computer Networks", 
        date: "2025-05-15", 
        startTime: "18:00", 
        endTime: "21:00", 
        capacity: 2, 
        bookedStudents: [] 
    },
    { 
        id: "s8", 
        examName: "Software Engineering", 
        date: "2025-05-16", 
        startTime: "14:00", 
        endTime: "17:00", 
        capacity: 1, 
        bookedStudents: [] 
    },
];

let allBookings = []; // Store all bookings globally

// Helper function to save data (in-memory, but we'll keep it as is for demo)
function saveData() {
    // In a real application, you would save to a database here
    console.log('Data saved (in-memory)');
}

// API Routes

// Get all exam slots
app.get('/api/slots', (req, res) => {
    res.json({ 
        success: true, 
        slots: examSlots 
    });
});

// Get specific slot by ID
app.get('/api/slots/:id', (req, res) => {
    const slot = examSlots.find(s => s.id === req.params.id);
    if (!slot) {
        return res.status(404).json({ 
            success: false, 
            message: 'Slot not found' 
        });
    }
    res.json({ 
        success: true, 
        slot: slot 
    });
});

// Book a slot
app.post('/api/book-slot', (req, res) => {
    const { slotId, studentName, studentEmail, studentRoll } = req.body;
    
    // Validation
    if (!slotId || !studentName || !studentEmail) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields: slotId, studentName, studentEmail' 
        });
    }
    
    // Find the slot
    const slot = examSlots.find(s => s.id === slotId);
    if (!slot) {
        return res.status(404).json({ 
            success: false, 
            message: 'Slot not found' 
        });
    }
    
    // Check capacity
    if (slot.bookedStudents.length >= slot.capacity) {
        return res.status(400).json({ 
            success: false, 
            message: 'Slot is already full' 
        });
    }
    
    // Check if student already booked this slot
    const alreadyBooked = slot.bookedStudents.some(s => s.email === studentEmail);
    if (alreadyBooked) {
        return res.status(400).json({ 
            success: false, 
            message: 'You have already booked this slot' 
        });
    }
    
    // Check if student has reached maximum bookings (max 2 slots)
    const userBookings = allBookings.filter(b => b.studentEmail === studentEmail);
    if (userBookings.length >= 2) {
        return res.status(400).json({ 
            success: false, 
            message: 'You have already booked 2 slots. Maximum limit reached.' 
        });
    }
    
    // Create booking record
    const booking = {
        id: uuidv4(),
        slotId: slot.id,
        examName: slot.examName,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        studentName: studentName,
        studentEmail: studentEmail,
        studentRoll: studentRoll || '',
        bookedAt: new Date().toISOString()
    };
    
    // Add to slot's booked students
    slot.bookedStudents.push({ 
        email: studentEmail, 
        name: studentName, 
        roll: studentRoll 
    });
    
    // Add to global bookings
    allBookings.push(booking);
    
    saveData();
    
    res.json({ 
        success: true, 
        message: 'Slot booked successfully!',
        booking: booking
    });
});

// Cancel a booking
app.delete('/api/cancel-booking/:slotId', (req, res) => {
    const { slotId } = req.params;
    const { studentEmail } = req.body;
    
    if (!studentEmail) {
        return res.status(400).json({ 
            success: false, 
            message: 'Student email is required' 
        });
    }
    
    // Find the slot
    const slot = examSlots.find(s => s.id === slotId);
    if (!slot) {
        return res.status(404).json({ 
            success: false, 
            message: 'Slot not found' 
        });
    }
    
    // Remove from slot's booked students
    const initialLength = slot.bookedStudents.length;
    slot.bookedStudents = slot.bookedStudents.filter(s => s.email !== studentEmail);
    
    if (slot.bookedStudents.length === initialLength) {
        return res.status(404).json({ 
            success: false, 
            message: 'Booking not found for this student' 
        });
    }
    
    // Remove from global bookings
    allBookings = allBookings.filter(b => !(b.slotId === slotId && b.studentEmail === studentEmail));
    
    saveData();
    
    res.json({ 
        success: true, 
        message: 'Booking cancelled successfully' 
    });
});

// Get student's bookings
app.get('/api/my-bookings/:email', (req, res) => {
    const { email } = req.params;
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required' 
        });
    }
    
    const studentBookings = allBookings.filter(b => b.studentEmail === email);
    
    res.json({ 
        success: true, 
        bookings: studentBookings 
    });
});

// Get all bookings (admin)
app.get('/api/all-bookings', (req, res) => {
    res.json({ 
        success: true, 
        totalBookings: allBookings.length,
        bookings: allBookings 
    });
});

// Reset system (admin only - for testing)
app.post('/api/reset', (req, res) => {
    // Reset slots to initial state
    examSlots = [
        { id: "s1", examName: "Mathematics – Final", date: "2025-05-12", startTime: "09:00", endTime: "12:00", capacity: 2, bookedStudents: [] },
        { id: "s2", examName: "Physics – Theory", date: "2025-05-12", startTime: "14:00", endTime: "17:00", capacity: 1, bookedStudents: [] },
        { id: "s3", examName: "Data Structures", date: "2025-05-13", startTime: "09:00", endTime: "12:00", capacity: 2, bookedStudents: [] },
        { id: "s4", examName: "Algorithms", date: "2025-05-13", startTime: "18:00", endTime: "21:00", capacity: 1, bookedStudents: [] },
        { id: "s5", examName: "Database Systems", date: "2025-05-14", startTime: "14:00", endTime: "17:00", capacity: 2, bookedStudents: [] },
        { id: "s6", examName: "Operating Systems", date: "2025-05-15", startTime: "09:00", endTime: "12:00", capacity: 1, bookedStudents: [] },
        { id: "s7", examName: "Computer Networks", date: "2025-05-15", startTime: "18:00", endTime: "21:00", capacity: 2, bookedStudents: [] },
        { id: "s8", examName: "Software Engineering", date: "2025-05-16", startTime: "14:00", endTime: "17:00", capacity: 1, bookedStudents: [] },
    ];
    allBookings = [];
    
    saveData();
    
    res.json({ 
        success: true, 
        message: 'System reset successfully' 
    });
});

// Serve the HTML UI (if you want to serve the frontend from the same server)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Exam Slot Booking System is running!`);
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`📋 API Endpoints:`);
    console.log(`   GET  /api/slots - Get all exam slots`);
    console.log(`   POST /api/book-slot - Book a slot`);
    console.log(`   DELETE /api/cancel-booking/:slotId - Cancel booking`);
    console.log(`   GET  /api/my-bookings/:email - Get student bookings`);
    console.log(`   POST /api/reset - Reset system (admin)`);
    console.log(`\n✨ Press Ctrl+C to stop the server\n`);
});
