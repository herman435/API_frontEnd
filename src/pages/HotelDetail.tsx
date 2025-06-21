import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { LocationOn, AttachMoney, Bed } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface Hotel {
  id: number;
  name: string;
  address: string;
  description?: string;
  price: number;
  availableRooms: number;
  operatorId: number;
}

const HotelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const bookingFormik = useFormik({
    initialValues: {
      checkInDate: '',
      checkOutDate: '',
      guestCount: 1,
      specialRequests: '',
    },
    validationSchema: Yup.object({
      checkInDate: Yup.date().required('Please select a check-in date'),
      checkOutDate: Yup.date()
        .min(Yup.ref('checkInDate'), 'Check-out date must be after check-in date')
        .required('Please select a check-out date'),
      guestCount: Yup.number()
        .min(1, 'At least 1 guest')
        .max(10, 'Up to 10 guests')
        .required('Please enter the number of guests'),
      specialRequests: Yup.string(),
    }),
    onSubmit: async (values) => {
      try {
        const response = await api.post('/bookings', {
          hotelId: hotel?.id,
          checkInDate: values.checkInDate,
          checkOutDate: values.checkOutDate,
          guestCount: values.guestCount,
          specialRequests: values.specialRequests,
        });
        
        setSnackbar({ 
          open: true, 
          message: response.data.message || 'Booking successful, we will contact you soon', 
          severity: 'success' 
        });
        setOpenBookingDialog(false);
        bookingFormik.resetForm();
        
        if (id) {
          const hotelResponse = await api.get(`/hotels/${id}`);
          setHotel(hotelResponse.data);
        }
      } catch (error: any) {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Booking failed', 
          severity: 'error' 
        });
      }
    },
  });

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/hotels/${id}`);
        setHotel(response.data);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Fail to get hotel data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHotel();
    }
  }, [id]);

  const handleBooking = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setOpenBookingDialog(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error || !hotel) {
    return (
      <Box maxWidth={800} mx="auto" mt={4} p={2}>
        <Alert severity="error">
          {error || 'Hotel not found'}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')} 
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth={1000} mx="auto" mt={4} p={2}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {hotel.name}
          </Typography>
          
          <Box display="flex" alignItems="center" mb={2}>
            <LocationOn color="action" sx={{ mr: 1 }} />
            <Typography color="text.secondary">
              {hotel.address}
            </Typography>
          </Box>

          {hotel.description && (
            <Typography variant="body1" paragraph>
              {hotel.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <AttachMoney color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" color="primary">
                  ¥{hotel.price}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  / night
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: '1 1 300px' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Bed color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  Available rooms: {hotel.availableRooms}
                </Typography>
                {hotel.availableRooms > 0 ? (
                  <Chip 
                    label="Available" 
                    color="success" 
                    size="small" 
                    sx={{ ml: 1 }}
                    onClick={(e) => e.preventDefault()}
                  />
                ) : (
                  <Chip 
                    label="Unavailable" 
                    color="error" 
                    size="small" 
                    sx={{ ml: 1 }}
                    onClick={(e) => e.preventDefault()}
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Box mt={3}>
            <Button
              variant="contained"
              size="large"
              onClick={handleBooking}
              disabled={hotel.availableRooms === 0}
              sx={{ mr: 2 }}
            >
              {hotel.availableRooms > 0 ? 'Book Now' : 'No Rooms Available'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Back to List
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openBookingDialog} onClose={() => setOpenBookingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book Hotel</DialogTitle>
        <form onSubmit={bookingFormik.handleSubmit}>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              {hotel.name}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              ¥{hotel.price} / night
            </Typography>
            
            <TextField
              fullWidth
              margin="normal"
              name="checkInDate"
              label="Check-in Date"
              type="date"
              value={bookingFormik.values.checkInDate}
              onChange={bookingFormik.handleChange}
              error={bookingFormik.touched.checkInDate && Boolean(bookingFormik.errors.checkInDate)}
              helperText={bookingFormik.touched.checkInDate && bookingFormik.errors.checkInDate}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              margin="normal"
              name="checkOutDate"
              label="Check-out Date"
              type="date"
              value={bookingFormik.values.checkOutDate}
              onChange={bookingFormik.handleChange}
              error={bookingFormik.touched.checkOutDate && Boolean(bookingFormik.errors.checkOutDate)}
              helperText={bookingFormik.touched.checkOutDate && bookingFormik.errors.checkOutDate}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              margin="normal"
              name="guestCount"
              label="Number of Guests"
              type="number"
              value={bookingFormik.values.guestCount}
              onChange={bookingFormik.handleChange}
              error={bookingFormik.touched.guestCount && Boolean(bookingFormik.errors.guestCount)}
              helperText={bookingFormik.touched.guestCount && bookingFormik.errors.guestCount}
            />
            
            <TextField
              fullWidth
              margin="normal"
              name="specialRequests"
              label="Special Requests"
              multiline
              rows={3}
              value={bookingFormik.values.specialRequests}
              onChange={bookingFormik.handleChange}
              error={bookingFormik.touched.specialRequests && Boolean(bookingFormik.errors.specialRequests)}
              helperText={bookingFormik.touched.specialRequests && bookingFormik.errors.specialRequests}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBookingDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Submit Booking
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HotelDetail; 