import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  CardActions,
  Chip,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Search as SearchIcon, 
  LocationOn, 
  AttachMoney, 
  Bed,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface Hotel {
  id: number;
  name: string;
  address: string;
  description?: string;
  price: number;
  availableRooms: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchHotels = async (name?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/hotels', { params: name ? { name } : {} });
      setHotels(res.data);
    } catch {
      setHotels([]);
    }
    setLoading(false);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const response = await api.get('/favorites');
      const favoriteIds = response.data.map((hotel: any) => hotel.id);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchHotels();
    fetchFavorites();
  }, [user]);

  const handleSearch = () => {
    fetchHotels(search);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewDetails = (hotelId: number) => {
    navigate(`/hotel/${hotelId}`);
  };

  const handleToggleFavorite = async (hotelId: number) => {
    if (!user) {
      setSnackbar({ open: true, message: 'Please login first', severity: 'error' });
      return;
    }

    try {
      if (favorites.includes(hotelId)) {
        await api.delete(`/favorites/${hotelId}`);
        setFavorites(favorites.filter(id => id !== hotelId));
        setSnackbar({ open: true, message: 'Removed from favorites', severity: 'success' });
      } else {
        await api.post('/favorites', { hotelId });
        setFavorites([...favorites, hotelId]);
        setSnackbar({ open: true, message: 'Added to favorites', severity: 'success' });
      }
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Operation failed', 
        severity: 'error' 
      });
    }
  };

  return (
    <Box maxWidth={1200} mx="auto" mt={4} p={2}>
      <Typography variant="h3" gutterBottom align="center" sx={{ mb: 4 }}>
        Welcome to Wanderlust Travel
      </Typography>
      
      <Typography variant="h5" mb={2} align="center" color="text.secondary">
        Discover the perfect travel accommodation
      </Typography>

      <Box display="flex" mb={4} sx={{ maxWidth: 600, mx: 'auto' }}>
        <TextField
          label="Search hotel name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ flex: 1, mr: 2 }}
          InputProps={{
            endAdornment: <SearchIcon color="action" />
          }}
        />
        <Button 
          variant="contained" 
          onClick={handleSearch}
          sx={{ minWidth: 100 }}
        >
          Search
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography>Loading...</Typography>
        </Box>
      ) : hotels.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography color="text.secondary">No hotels available</Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          {hotels.map(hotel => (
            <Card key={hotel.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography
                    variant="h6"
                    sx={{
                      flex: 1,
                      mr: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {hotel.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleFavorite(hotel.id)}
                    color={favorites.includes(hotel.id) ? 'error' : 'default'}
                  >
                    {favorites.includes(hotel.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationOn color="action" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      maxWidth: '220px',
                    }}
                  >
                    {hotel.address}
                  </Typography>
                </Box>

                {hotel.description && (
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
                      minHeight: '3.2em', 
                    }}
                  >
                    {hotel.description}
                  </Typography>
                )}

                <Box display="flex" alignItems="center" mb={1}>
                  <AttachMoney color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="primary">
                    ¥{hotel.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    / night
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <Bed color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
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
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => handleViewDetails(hotel.id)}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Home; 