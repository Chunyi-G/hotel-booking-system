import { Alert, Box, Button, Card, CardActions, CardContent, Container, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { formatDate } from '../utils/formatters'

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
                  <Typography fontWeight={700}>{formatDate(booking.check_in)}</Typography>
                </Box>
                <Box className="booking-summary">
                  <Typography color="text.secondary">Check-out Date</Typography>
                  <Typography fontWeight={700}>{formatDate(booking.check_out)}</Typography>
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

export default BookingSuccessPage
