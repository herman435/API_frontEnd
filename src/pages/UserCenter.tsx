import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Favorite as FavoriteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

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

interface FavoriteHotel {
  id: number;
  name: string;
  address: string;
  price: number;
  availableRooms: number;
}

interface Booking {
  id: number;
  hotelName: string;
  hotelAddress: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalPrice: number;
  status: string;
  specialRequests?: string;
  createdAt: string;
}

const UserCenter: React.FC = () => {
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteHotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const profileFormik = useFormik({
    initialValues: {
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Please enter a valid email').required('Please enter your email'),
      currentPassword: Yup.string().when('newPassword', {
        is: (val: string) => val && val.length > 0,
        then: (schema) => schema.required('Please enter your current password'),
      }),
      newPassword: Yup.string().min(6, 'Password must be at least 6 characters'),
      confirmPassword: Yup.string().when('newPassword', {
        is: (val: string) => val && val.length > 0,
        then: (schema) => schema
          .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
          .required('Please confirm your new password'),
      }),
    }),
    onSubmit: async (values) => {
      try {
        if (values.newPassword) {
          await api.post('/auth/change-password', {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          });
          setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
        }
        setOpenProfileDialog(false);
        profileFormik.resetForm();
      } catch (error: any) {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Update failed', 
          severity: 'error' 
        });
      }
    },
  });

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await api.get('/favorites');
      setFavorites(response.data);
    } catch (error) {
      console.error('Fail to get fav list:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to fetch favorites', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Fail to get booking record:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to fetch bookings', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 1) {
      fetchFavorites();
    } else if (tabValue === 2) {
      fetchBookings();
    }
  }, [tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRemoveFavorite = async (hotelId: number) => {
    try {
      await api.delete(`/favorites/${hotelId}`);
      setFavorites(favorites.filter(hotel => hotel.id !== hotelId));
      setSnackbar({ open: true, message: 'Removed from favorites', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Remove failed', 
        severity: 'error' 
      });
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      ));
      setSnackbar({ open: true, message: 'Booking cancelled', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Cancel failed', 
        severity: 'error' 
      });
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Please login first</Typography>
      </Box>
    );
  }

  return (
    <Box maxWidth={1000} mx="auto" mt={4} p={2}>
      <Typography variant="h4" gutterBottom>
        User Center
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Profile" />
          <Tab label="My Favorites" />
          <Tab label="Booking Records" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar sx={{ width: 80, height: 80, mr: 2 }}>
                {user.email.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{user.email}</Typography>
                <Typography color="text.secondary">
                  Role: {user.role === 'operator' ? 'Operator' : 'User'}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setOpenProfileDialog(true)}
                sx={{ ml: 'auto' }}
              >
                Edit Profile
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          My Favorites ({favorites.length})
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Loading...</Typography>
          </Box>
        ) : favorites.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary" align="center">
                No favorite hotels
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <List>
            {favorites.map((hotel) => (
              <Card key={hotel.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <ListItemAvatar>
                      <Avatar>
                        <FavoriteIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {hotel.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {hotel.address}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h6" color="primary">
                          ¥{hotel.price}
                        </Typography>
                        <Chip 
                          label={hotel.availableRooms > 0 ? 'Available' : 'Unavailable'} 
                          color={hotel.availableRooms > 0 ? 'success' : 'error'}
                          size="small"
                          onClick={(e) => e.preventDefault()}
                        />
                      </Box>
                    </Box>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveFavorite(hotel.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Booking Records ({bookings.length})
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Loading...</Typography>
          </Box>
        ) : bookings.length === 0 ? (
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
                    {booking.status === 'pending' && (
                      <IconButton
                        color="error"
                        onClick={() => handleCancelBooking(booking.id)}
                        title="Cancel Booking"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </TabPanel>

      <Dialog open={openProfileDialog} onClose={() => setOpenProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <form onSubmit={profileFormik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              name="email"
              label="Email"
              value={profileFormik.values.email}
              onChange={profileFormik.handleChange}
              error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
              helperText={profileFormik.touched.email && profileFormik.errors.email}
            />
            <TextField
              fullWidth
              margin="normal"
              name="currentPassword"
              label="Current Password"
              type="password"
              value={profileFormik.values.currentPassword}
              onChange={profileFormik.handleChange}
              error={profileFormik.touched.currentPassword && Boolean(profileFormik.errors.currentPassword)}
              helperText={profileFormik.touched.currentPassword && profileFormik.errors.currentPassword}
            />
            <TextField
              fullWidth
              margin="normal"
              name="newPassword"
              label="New Password"
              type="password"
              value={profileFormik.values.newPassword}
              onChange={profileFormik.handleChange}
              error={profileFormik.touched.newPassword && Boolean(profileFormik.errors.newPassword)}
              helperText={profileFormik.touched.newPassword && profileFormik.errors.newPassword}
            />
            <TextField
              fullWidth
              margin="normal"
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={profileFormik.values.confirmPassword}
              onChange={profileFormik.handleChange}
              error={profileFormik.touched.confirmPassword && Boolean(profileFormik.errors.confirmPassword)}
              helperText={profileFormik.touched.confirmPassword && profileFormik.errors.confirmPassword}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProfileDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
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

export default UserCenter; 