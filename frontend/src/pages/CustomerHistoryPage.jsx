import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import LoadingState from '../components/LoadingState'
import { formatCurrency, formatDate } from '../utils/formatters'
import { getBookingStayStatus, getBookingStayStatusChipColor } from '../utils/roomStatus'

function getNightCount(checkIn, checkOut) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24
  const start = new Date(checkIn)
  const end = new Date(checkOut)

  return Math.max(0, Math.round((end - start) / millisecondsPerDay))
}

function CustomerHistoryPage() {
  const { email } = useParams()
  const customerEmail = decodeURIComponent(email)
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCustomerBookings = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/bookings')
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load customer history.')
        }

        const customerBookings = (payload.data || [])
          .filter((booking) => booking.customer_email === customerEmail)
          .sort((firstBooking, secondBooking) => {
            return new Date(secondBooking.check_in) - new Date(firstBooking.check_in)
          })

        setBookings(customerBookings)
      } catch (loadError) {
        setBookings([])
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomerBookings()
  }, [customerEmail])

  const customerSummary = useMemo(() => {
    const totalNights = bookings.reduce((total, booking) => {
      return total + getNightCount(booking.check_in, booking.check_out)
    }, 0)

    const totalSpent = bookings.reduce((total, booking) => {
      if (booking.status !== 'confirmed') {
        return total
      }

      return total + Number(booking.total_price || 0)
    }, 0)

    return {
      customerName: bookings[0]?.customer_name || 'Customer',
      totalBookings: bookings.length,
      totalNights,
      totalSpent,
    }
  }, [bookings])

  return (
    <Box className="app-shell">
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box className="page-header">
              <Typography component="h1" variant="h1">
                Customer History
              </Typography>
              <Typography color="text.secondary">
                View booking activity for one customer.
              </Typography>
            </Box>
            <Box>
              <Button component={RouterLink} to="/staff-dashboard" variant="outlined">
                Back to Dashboard
              </Button>
            </Box>
          </Stack>

          {isLoading && <LoadingState message="Loading customer history" />}

          {error && <Alert severity="error">{error}</Alert>}

          {!isLoading && !error && bookings.length === 0 && (
            <Alert severity="info">
              No booking history found for {customerEmail}.
            </Alert>
          )}

          {!isLoading && !error && bookings.length > 0 && (
            <>
              <Card className="room-details-panel" variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography color="text.secondary">Customer</Typography>
                    <Typography component="h2" variant="h2">
                      {customerSummary.customerName}
                    </Typography>
                    <Typography color="text.secondary">{customerEmail}</Typography>
                  </Stack>
                </CardContent>
              </Card>

              <Box className="dashboard-summary-grid">
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary">Total Bookings</Typography>
                    <Typography component="p" variant="h1" className="summary-value">
                      {customerSummary.totalBookings}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary">Total Nights Stayed</Typography>
                    <Typography component="p" variant="h1" className="summary-value">
                      {customerSummary.totalNights}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary">Total Amount Spent</Typography>
                    <Typography component="p" variant="h1" className="summary-value">
                      {formatCurrency(customerSummary.totalSpent)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Card variant="outlined">
                <TableContainer>
                  <Table className="customer-history-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Booking ID</TableCell>
                        <TableCell>Room Number</TableCell>
                        <TableCell>Check In</TableCell>
                        <TableCell>Check Out</TableCell>
                        <TableCell align="right">Guests</TableCell>
                        <TableCell align="right">Total Price</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id} hover>
                          <TableCell>#{booking.id}</TableCell>
                          <TableCell>{booking.room?.number}</TableCell>
                          <TableCell>{formatDate(booking.check_in)}</TableCell>
                          <TableCell>{formatDate(booking.check_out)}</TableCell>
                          <TableCell align="right">{booking.guests}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(booking.total_price)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={getBookingStayStatusChipColor(getBookingStayStatus(booking))}
                              label={getBookingStayStatus(booking)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

export default CustomerHistoryPage
