import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  IconButton,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon, Done as DoneIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Hotel {
  id: number;
  name: string;
  address: string;
  description?: string;
  price: number;
  availableRooms: number;
  operatorId: number;
}

interface Booking {
  id: number;
  hotelName: string;
  hotelAddress: string;
  userEmail: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalPrice: number;
  status: string;
  specialRequests?: string;
  createdAt: string;
}

const OperatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const validationSchema = Yup.object({
    name: Yup.string().required('Hotel name is required'),
    address: Yup.string().required('Address is required'),
    price: Yup.number().positive('Price must be positive').required('Price is required'),
    availableRooms: Yup.number().integer('Room count must be an integer').min(0, 'Room count cannot be negative').required('Room count is required'),
    description: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      address: '',
      description: '',
      price: '',
      availableRooms: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (editingHotel) {
          await api.put(`/hotels/${editingHotel.id}`, {
            ...values,
            price: parseFloat(values.price),
            availableRooms: parseInt(values.availableRooms),
          });
          setSnackbar({ open: true, message: 'Hotel updated successfully', severity: 'success' });
        } else {
          await api.post('/hotels', {
            ...values,
            price: parseFloat(values.price),
            availableRooms: parseInt(values.availableRooms),
          });
          setSnackbar({ open: true, message: 'Hotel added successfully', severity: 'success' });
        }
        fetchHotels();
        handleCloseDialog();
      } catch (error: any) {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Operation failed', 
          severity: 'error' 
        });
      }
    },
  });

  const fetchHotels = async () => {
    try {
      const response = await api.get('/hotels');
      setHotels(response.data);
    } catch (error) {
      console.error('Failed to fetch hotel list:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/operator');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch booking list:', error);
    }
  };

  useEffect(() => {
    fetchHotels();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      fetchBookings();
    }
  }, [tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (hotel?: Hotel) => {
    if (hotel) {
      setEditingHotel(hotel);
      formik.setValues({
        name: hotel.name,
        address: hotel.address,
        description: hotel.description || '',
        price: hotel.price.toString(),
        availableRooms: hotel.availableRooms.toString(),
      });
    } else {
      setEditingHotel(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingHotel(null);
    formik.resetForm();
  };

  const handleDeleteHotel = async (hotelId: number) => {
    if (window.confirm('Are you sure you want to delete this hotel?')) {
      try {
        await api.delete(`/hotels/${hotelId}`);
        setSnackbar({ open: true, message: 'Hotel deleted successfully', severity: 'success' });
        fetchHotels();
      } catch (error: any) {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Delete failed', 
          severity: 'error' 
        });
      }
    }
  };

  const handleConfirmBooking = async (bookingId: number) => {
    try {
      await api.post(`/bookings/${bookingId}/confirm`);
      setSnackbar({ open: true, message: 'Booking confirmed', severity: 'success' });
      fetchBookings();
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Confirm failed', 
        severity: 'error' 
      });
    }
  };

  const handleCompleteBooking = async (bookingId: number) => {
    try {
      await api.post(`/bookings/${bookingId}/complete`);
      setSnackbar({ open: true, message: 'Booking completed', severity: 'success' });
      fetchBookings();
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Complete failed', 
        severity: 'error' 
      });
    }
  };

  return (
    <Box maxWidth={1200} mx="auto" mt={4} p={2}>
      <Typography variant="h4" gutterBottom>Operator Dashboard</Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Hotel Management" />
          <Tab label="Booking Management" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Hotel Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Hotel
          </Button>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          {hotels.map((hotel) => (
            <Card key={hotel.id}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="h6"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1
                    }}
                  >
                    {hotel.name}
                  </Typography>
                  {user && hotel.operatorId === user.id ? (
                    <Chip label="Mine" color="success" size="small" sx={{ ml: 1 }} />
                  ) : (
                    <Chip label="Not yours" color="warning" size="small" sx={{ ml: 1 }} />
                  )}
                </Box>
                <Typography
                  color="text.secondary"
                  gutterBottom
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {hotel.address}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  paragraph
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {hotel.description}
                </Typography>
                <Typography variant="h6" color="primary">
                  ¥{hotel.price}
                </Typography>
                <Typography variant="body2">
                  Available rooms: {hotel.availableRooms}
                </Typography>
                <Box mt={2} display="flex" gap={1}>
                  <IconButton
                    size="small"
                    color={user && hotel.operatorId === user.id ? 'primary' : 'default'}
                    onClick={user && hotel.operatorId === user.id ? () => handleOpenDialog(hotel) : undefined}
                    disabled={!(user && hotel.operatorId === user.id)}
                    title={user && hotel.operatorId === user.id ? 'Edit Hotel' : 'You cannot edit this hotel'}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteHotel(hotel.id)}
                    disabled={!(user && hotel.operatorId === user.id)}
                    title={user && hotel.operatorId === user.id ? 'Delete Hotel' : 'You cannot delete this hotel'}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h5" gutterBottom>
          Booking Management ({bookings.length})
        </Typography>
        {bookings.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary" align="center">
                No booking records
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <List>
            {bookings.map((booking) => (
              <Card key={booking.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <ListItemAvatar>
                      <Avatar>
                        {booking.hotelName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {booking.hotelName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {booking.hotelAddress}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Customer: {booking.userEmail}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Typography variant="body2">
                          Check-in: {new Date(booking.checkInDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          Check-out: {new Date(booking.checkOutDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          {booking.guestCount} guest(s)
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h6" color="primary">
                          ¥{booking.totalPrice}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1, 
                            backgroundColor: 
                              booking.status === 'pending' ? 'warning.light' :
                              booking.status === 'confirmed' ? 'success.light' :
                              booking.status === 'cancelled' ? 'error.light' :
                              booking.status === 'completed' ? 'grey.300' : 'grey.300',
                            color: 
                              booking.status === 'pending' ? 'warning.dark' :
                              booking.status === 'confirmed' ? 'success.dark' :
                              booking.status === 'cancelled' ? 'error.dark' :
                              booking.status === 'completed' ? 'grey.700' : 'grey.700',
                          }}
                        >
                          {booking.status === 'pending' ? 'Pending' :
                           booking.status === 'confirmed' ? 'Confirmed' :
                           booking.status === 'cancelled' ? 'Cancelled' :
                           booking.status === 'completed' ? 'Completed' : booking.status}
                        </Typography>
                      </Box>
                      {booking.specialRequests && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Special Requests: {booking.specialRequests}
                        </Typography>
                      )}
                    </Box>
                    <Box display="flex" gap={1}>
                      {booking.status === 'pending' && (
                        <IconButton
                          color="success"
                          onClick={() => handleConfirmBooking(booking.id)}
                          title="Confirm Booking"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      {booking.status === 'confirmed' && (
                        <IconButton
                          color="primary"
                          onClick={() => handleCompleteBooking(booking.id)}
                          title="Complete Booking"
                        >
                          <DoneIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </TabPanel>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingHotel ? 'Edit Hotel' : 'Add Hotel'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              name="name"
              label="Hotel Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              fullWidth
              margin="normal"
              name="address"
              label="Address"
              value={formik.values.address}
              onChange={formik.handleChange}
              error={formik.touched.address && Boolean(formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
            />
            <TextField
              fullWidth
              margin="normal"
              name="description"
              label="Description"
              multiline
              rows={3}
              value={formik.values.description}
              onChange={formik.handleChange}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
            />
            <TextField
              fullWidth
              margin="normal"
              name="price"
              label="Price"
              type="number"
              value={formik.values.price}
              onChange={formik.handleChange}
              error={formik.touched.price && Boolean(formik.errors.price)}
              helperText={formik.touched.price && formik.errors.price}
            />
            <TextField
              fullWidth
              margin="normal"
              name="availableRooms"
              label="Available Rooms"
              type="number"
              value={formik.values.availableRooms}
              onChange={formik.handleChange}
              error={formik.touched.availableRooms && Boolean(formik.errors.availableRooms)}
              helperText={formik.touched.availableRooms && formik.errors.availableRooms}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingHotel ? 'Update' : 'Add'}
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

export default OperatorDashboard;