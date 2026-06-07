import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Link as RouterLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material'
import './App.css'

const roomCategories = [
  { value: '', label: 'Any category' },
  { value: 'standard', label: 'Standard' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'suite', label: 'Suite' },
]

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f766e',
    },
    secondary: {
      main: '#334155',
    },
    background: {
      default: '#f7f9fb',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: ['Inter', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
  },
})

function formatCurrency(value) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(Number(value))
}

function RoomSearchPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    check_in: '',
    check_out: '',
    category: '',
  })
  const [rooms, setRooms] = useState([])
  const [hasFiltered, setHasFiltered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [bookingForm, setBookingForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    guests: 1,
  })
  const [bookingErrors, setBookingErrors] = useState({})
  const [bookingErrorMessage, setBookingErrorMessage] = useState('')
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [bookingCompleted, setBookingCompleted] = useState(false)

  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/rooms')
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load rooms.')
        }

        setRooms(payload.data || [])
      } catch (loadError) {
        setRooms([])
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadRooms()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const handleBookingChange = (event) => {
    const { name, value } = event.target
    setBookingForm((current) => ({ ...current, [name]: value }))
  }

  const resetBookingState = () => {
    setSelectedRoom(null)
    setBookingForm({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      guests: 1,
    })
    setBookingErrors({})
    setBookingErrorMessage('')
    setBookingCompleted(false)
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    setError('')
    setHasFiltered(true)

    const hasCheckIn = Boolean(filters.check_in)
    const hasCheckOut = Boolean(filters.check_out)
    const hasDateRange = hasCheckIn && hasCheckOut

    if (hasCheckIn !== hasCheckOut) {
      setError('Please select both check-in and check-out dates to filter by availability.')
      setRooms([])
      return
    }

    if (hasDateRange && filters.check_out <= filters.check_in) {
      setError('Check-out date must be after check-in date.')
      setRooms([])
      return
    }

    const params = new URLSearchParams()

    if (hasDateRange) {
      params.set('check_in', filters.check_in)
      params.set('check_out', filters.check_out)
    }

    if (filters.category) {
      params.set('category', filters.category)
    }

    const endpoint = hasDateRange ? '/api/rooms/available' : '/api/rooms'
    const queryString = params.toString()

    setIsLoading(true)

    try {
      const response = await fetch(queryString ? `${endpoint}?${queryString}` : endpoint)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to filter rooms.')
      }

      setRooms(payload.data || [])
    } catch (filterError) {
      setRooms([])
      setError(filterError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookNow = (room) => {
    setError('')
    setBookingErrors({})
    setBookingErrorMessage('')

    if (!filters.check_in || !filters.check_out) {
      setError('Please select check-in and check-out dates before booking.')
      return
    }

    if (filters.check_out <= filters.check_in) {
      setError('Check-out date must be after check-in date.')
      return
    }

    setSelectedRoom(room)
    setBookingForm((current) => ({
      ...current,
      guests: Math.min(Number(current.guests) || 1, room.capacity),
    }))
  }

  const getFieldError = (field) => bookingErrors[field]?.[0] || ''

  const handleBookingSubmit = async (event) => {
    event.preventDefault()

    if (isSubmittingBooking || bookingCompleted) {
      return
    }

    setBookingErrors({})
    setBookingErrorMessage('')
    setIsSubmittingBooking(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          check_in: filters.check_in,
          check_out: filters.check_out,
          customer_name: bookingForm.customer_name,
          customer_email: bookingForm.customer_email,
          customer_phone: bookingForm.customer_phone,
          guests: Number(bookingForm.guests),
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        if (payload.errors) {
          setBookingErrors(payload.errors)
          setBookingErrorMessage(
            payload.message || Object.values(payload.errors).flat()[0] || 'Please check the form.',
          )
        } else {
          setBookingErrors({ form: [payload.message || 'Unable to create booking.'] })
          setBookingErrorMessage(payload.message || 'Unable to create booking.')
        }
        return
      }

      setBookingCompleted(true)
      navigate('/booking-success', {
        state: {
          booking: payload.data,
        },
      })
    } catch {
      setBookingErrors({ form: ['Unable to create booking. Please try again.'] })
      setBookingErrorMessage('Unable to create booking. Please try again.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  if (selectedRoom) {
    return (
      <Box className="app-shell">
        <Container maxWidth="md">
          <Stack spacing={4}>
            <Box className="page-header">
              <Typography component="h1" variant="h1">
                Create Booking
              </Typography>
              <Typography color="text.secondary">
                Complete customer details for the selected room.
              </Typography>
            </Box>

            <Card className="booking-panel" variant="outlined">
              <CardContent>
                <Stack spacing={3}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Typography component="h2" variant="h2">
                        Room {selectedRoom.number}
                      </Typography>
                      <Typography color="text.secondary">
                        {selectedRoom.category} · {selectedRoom.capacity} guests ·{' '}
                        {formatCurrency(selectedRoom.price_per_night)} / night
                      </Typography>
                    </Box>
                    <Box>
                      <Typography color="text.secondary">Stay Dates</Typography>
                      <Typography fontWeight={700}>
                        {filters.check_in} to {filters.check_out}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  {bookingErrorMessage && <Alert severity="error">{bookingErrorMessage}</Alert>}

                  <Box component="form" onSubmit={handleBookingSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          required
                          error={Boolean(getFieldError('customer_name'))}
                          helperText={getFieldError('customer_name')}
                          label="Customer Name"
                          name="customer_name"
                          value={bookingForm.customer_name}
                          onChange={handleBookingChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          error={Boolean(getFieldError('customer_email'))}
                          helperText={getFieldError('customer_email')}
                          label="Email"
                          name="customer_email"
                          type="email"
                          value={bookingForm.customer_email}
                          onChange={handleBookingChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          error={Boolean(getFieldError('customer_phone'))}
                          helperText={getFieldError('customer_phone')}
                          label="Phone"
                          name="customer_phone"
                          value={bookingForm.customer_phone}
                          onChange={handleBookingChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          error={Boolean(getFieldError('guests'))}
                          helperText={getFieldError('guests')}
                          inputProps={{ min: 1, max: selectedRoom.capacity }}
                          label="Number of Guests"
                          name="guests"
                          type="number"
                          value={bookingForm.guests}
                          onChange={handleBookingChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmittingBooking || bookingCompleted}
                          >
                            {isSubmittingBooking ? 'Submitting...' : 'Submit Booking'}
                          </Button>
                          <Button type="button" variant="outlined" onClick={resetBookingState}>
                            Back to Rooms
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </Box>
    )
  }

  return (
    <Box className="app-shell">
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box className="page-header">
            <Typography component="h1" variant="h1">
              Room Search
            </Typography>
            <Typography color="text.secondary">
              Browse rooms or filter by availability and category.
            </Typography>
          </Box>

          <Card className="search-panel" variant="outlined">
            <Typography component="h2" variant="h2" className="filter-title">
              Filter Rooms
            </Typography>
            <Box component="form" onSubmit={handleSearch}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    label="Check-in Date"
                    name="check_in"
                    type="date"
                    value={filters.check_in}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    label="Check-out Date"
                    name="check_out"
                    type="date"
                    value={filters.check_out}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="category-label">Room Category</InputLabel>
                    <Select
                      label="Room Category"
                      labelId="category-label"
                      name="category"
                      value={filters.category}
                      onChange={handleChange}
                    >
                      {roomCategories.map((category) => (
                        <MenuItem key={category.label} value={category.value}>
                          {category.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Filtering...' : 'Filter'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Card>

          {error && <Alert severity="error">{error}</Alert>}

          {isLoading && (
            <Box className="loading-state">
              <CircularProgress size={28} />
              <Typography color="text.secondary">Loading rooms</Typography>
            </Box>
          )}

          {!isLoading && hasFiltered && !error && rooms.length === 0 && (
            <Alert severity="info">No rooms found for those filters.</Alert>
          )}

          {!isLoading && rooms.length > 0 && (
            <Grid container spacing={2.5}>
              {rooms.map((room) => (
                <Grid item xs={12} sm={6} md={4} key={room.id}>
                  <Card className="room-card" variant="outlined">
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Typography component="h2" variant="h2">
                            Room {room.number}
                          </Typography>
                          <Chip
                            color="primary"
                            label={room.category}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>

                        <Stack spacing={1}>
                          <Typography color="text.secondary">
                            Capacity: {room.capacity} guests
                          </Typography>
                          <Typography className="room-price">
                            {formatCurrency(room.price_per_night)} / night
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                    <CardActions>
                      <Button fullWidth variant="contained" onClick={() => handleBookNow(room)}>
                        Book Now
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

function BookingSuccessPage() {
  const location = useLocation()
  const booking = location.state?.booking

  if (!booking) {
    return (
      <Box className="app-shell">
        <Container maxWidth="sm">
          <Stack spacing={3}>
            <Alert severity="info">
              Booking details are not available. Please create a booking first.
            </Alert>
            <Button component={RouterLink} to="/" variant="contained">
              Back to Rooms
            </Button>
          </Stack>
        </Container>
      </Box>
    )
  }

  return (
    <Box className="app-shell">
      <Container maxWidth="sm">
        <Stack spacing={4}>
          <Box className="page-header">
            <Typography component="h1" variant="h1">
              Booking Successful
            </Typography>
            <Typography color="text.secondary">The booking has been confirmed.</Typography>
          </Box>

          <Card className="booking-panel" variant="outlined">
            <CardContent>
              <Stack spacing={2.5}>
                <Alert severity="success">Booking successful.</Alert>
                <Box className="booking-summary">
                  <Typography color="text.secondary">Booking ID</Typography>
                  <Typography fontWeight={700}>#{booking.id}</Typography>
                </Box>
                <Box className="booking-summary">
                  <Typography color="text.secondary">Room Number</Typography>
                  <Typography fontWeight={700}>{booking.room?.number}</Typography>
                </Box>
                <Box className="booking-summary">
                  <Typography color="text.secondary">Customer Name</Typography>
                  <Typography fontWeight={700}>{booking.customer_name}</Typography>
                </Box>
                <Box className="booking-summary">
                  <Typography color="text.secondary">Check-in Date</Typography>
                  <Typography fontWeight={700}>{booking.check_in}</Typography>
                </Box>
                <Box className="booking-summary">
                  <Typography color="text.secondary">Check-out Date</Typography>
                  <Typography fontWeight={700}>{booking.check_out}</Typography>
                </Box>
              </Stack>
            </CardContent>
            <CardActions>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} width="100%">
                <Button component={RouterLink} to="/" variant="contained">
                  Back to Rooms
                </Button>
                <Button component={RouterLink} to="/staff-dashboard" variant="outlined">
                  View Staff Dashboard
                </Button>
              </Stack>
            </CardActions>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoomSearchPage />} />
          <Route path="/booking-success" element={<BookingSuccessPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
