import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material'
import LoadingState from '../components/LoadingState'
import { compareSortValues, getBookingSortValue } from '../utils/bookingSort'
import { formatCurrency, formatDate } from '../utils/formatters'
import {
  getBookingStayStatus,
  getBookingStayStatusChipColor,
  getRoomStatus,
  getRoomStatusChipColor,
} from '../utils/roomStatus'

function StaffDashboardPage() {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboardFilters, setDashboardFilters] = useState({
    customerName: '',
    status: '',
  })
  const [sortConfig, setSortConfig] = useState({
    field: 'id',
    direction: 'desc',
  })
  const [selectedBooking, setSelectedBooking] = useState(null)

  const summaryStats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const upcomingCheckIns = bookings.filter((booking) => {
      return booking.status === 'confirmed' && new Date(booking.check_in) >= today
    }).length

    const totalRevenue = bookings.reduce((total, booking) => {
      if (booking.status !== 'confirmed') {
        return total
      }

      return total + Number(booking.total_price || 0)
    }, 0)

    return {
      totalBookings: bookings.length,
      upcomingCheckIns,
      totalRevenue,
    }
  }, [bookings])

  const filteredAndSortedBookings = useMemo(() => {
    const customerName = dashboardFilters.customerName.trim().toLowerCase()

    const filteredBookings = bookings.filter((booking) => {
      const matchesName = booking.customer_name.toLowerCase().includes(customerName)
      const matchesStatus = dashboardFilters.status
        ? getBookingStayStatus(booking) === dashboardFilters.status
        : true

      return matchesName && matchesStatus
    })

    return filteredBookings.sort((firstBooking, secondBooking) => {
      const firstValue = getBookingSortValue(firstBooking, sortConfig.field)
      const secondValue = getBookingSortValue(secondBooking, sortConfig.field)
      const comparison = compareSortValues(firstValue, secondValue)

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [bookings, dashboardFilters, sortConfig])

  const bookingStatuses = ['Reserved', 'Occupied', 'Completed']

  useEffect(() => {
    const loadBookings = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/bookings')
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load bookings.')
        }

        setBookings(payload.data || [])
      } catch (loadError) {
        setBookings([])
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadBookings()
  }, [])

  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleDashboardFilterChange = (event) => {
    const { name, value } = event.target
    setDashboardFilters((current) => ({ ...current, [name]: value }))
  }

  const handleCloseBookingDialog = () => {
    setSelectedBooking(null)
  }

  const renderSortLabel = (field, label) => (
    <TableSortLabel
      active={sortConfig.field === field}
      direction={sortConfig.field === field ? sortConfig.direction : 'asc'}
      onClick={() => handleSort(field)}
    >
      {label}
    </TableSortLabel>
  )

  return (
    <Box className="app-shell">
      <Container maxWidth="xl">
        <Stack spacing={4}>
          <Box className="page-header">
            <Typography component="h1" variant="h1">
              Staff Dashboard
            </Typography>
            <Typography color="text.secondary">
              View hotel bookings. Click sortable headers to change order.
            </Typography>
          </Box>

          {isLoading && <LoadingState message="Loading bookings" />}

          {error && <Alert severity="error">{error}</Alert>}

          {!isLoading && !error && bookings.length === 0 && (
            <Alert severity="info">No bookings found.</Alert>
          )}

          {!isLoading && !error && bookings.length > 0 && (
            <>
              <Box className="dashboard-summary-grid">
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary">Total Bookings</Typography>
                    <Typography component="p" variant="h1" className="summary-value">
                      {summaryStats.totalBookings}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary">Upcoming Check-ins</Typography>
                    <Typography component="p" variant="h1" className="summary-value">
                      {summaryStats.upcomingCheckIns}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary">Total Revenue</Typography>
                    <Typography component="p" variant="h1" className="summary-value">
                      {formatCurrency(summaryStats.totalRevenue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Card className="dashboard-filter-panel" variant="outlined">
                <Box className="dashboard-filter-grid">
                  <Box>
                    <TextField
                      fullWidth
                      label="Search Customer Name"
                      name="customerName"
                      value={dashboardFilters.customerName}
                      onChange={handleDashboardFilterChange}
                    />
                  </Box>
                  <Box>
                    <FormControl fullWidth>
                      <InputLabel id="booking-status-label">Status</InputLabel>
                      <Select
                        label="Status"
                        labelId="booking-status-label"
                        name="status"
                        value={dashboardFilters.status}
                        onChange={handleDashboardFilterChange}
                      >
                        <MenuItem value="">All statuses</MenuItem>
                        {bookingStatuses.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Card>

              {filteredAndSortedBookings.length === 0 ? (
                <Alert severity="info">No bookings match those filters.</Alert>
              ) : (
                <Card variant="outlined">
                  <TableContainer>
                    <Table className="bookings-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>{renderSortLabel('id', 'Booking ID')}</TableCell>
                          <TableCell>{renderSortLabel('room_number', 'Room Number')}</TableCell>
                          <TableCell>{renderSortLabel('customer_name', 'Customer Name')}</TableCell>
                          <TableCell>Customer Email</TableCell>
                          <TableCell>Room Status</TableCell>
                          <TableCell>{renderSortLabel('check_in', 'Check In')}</TableCell>
                          <TableCell>{renderSortLabel('check_out', 'Check Out')}</TableCell>
                          <TableCell align="right">Guests</TableCell>
                          <TableCell align="right">Total Price</TableCell>
                          <TableCell>{renderSortLabel('status', 'Status')}</TableCell>
                          <TableCell align="right">History</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredAndSortedBookings.map((booking) => (
                          <TableRow
                            key={booking.id}
                            hover
                            className="clickable-row"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <TableCell>#{booking.id}</TableCell>
                            <TableCell>{booking.room?.number}</TableCell>
                            <TableCell>{booking.customer_name}</TableCell>
                            <TableCell>{booking.customer_email}</TableCell>
                            <TableCell>
                              <Chip
                                color={getRoomStatusChipColor(
                                  getRoomStatus(booking.room_id, bookings),
                                )}
                                label={getRoomStatus(booking.room_id, bookings)}
                                size="small"
                              />
                            </TableCell>
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
                            <TableCell align="right">
                              <Button
                                component={RouterLink}
                                size="small"
                                to={`/rooms/${booking.room_id}/history`}
                                variant="outlined"
                                onClick={(event) => event.stopPropagation()}
                              >
                                View History
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}
            </>
          )}
        </Stack>
      </Container>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={Boolean(selectedBooking)}
        onClose={handleCloseBookingDialog}
      >
        <DialogTitle>Booking Details</DialogTitle>
        {selectedBooking && (
          <DialogContent>
            <Stack spacing={2}>
              <Box className="booking-summary">
                <Typography color="text.secondary">Booking ID</Typography>
                <Typography fontWeight={700}>#{selectedBooking.id}</Typography>
              </Box>
              <Box className="booking-summary">
                <Typography color="text.secondary">Room Number</Typography>
                <Typography fontWeight={700}>{selectedBooking.room?.number}</Typography>
              </Box>
              <Box className="booking-summary">
                <Typography color="text.secondary">Customer Name</Typography>
                <Typography fontWeight={700}>{selectedBooking.customer_name}</Typography>
              </Box>
              <Box className="booking-summary">
                <Typography color="text.secondary">Customer Email</Typography>
                <Typography fontWeight={700}>{selectedBooking.customer_email}</Typography>
              </Box>
              <Box className="booking-summary">
                <Typography color="text.secondary">Check In</Typography>
                <Typography fontWeight={700}>{formatDate(selectedBooking.check_in)}</Typography>
              </Box>
              <Box className="booking-summary">
                <Typography color="text.secondary">Check Out</Typography>
                <Typography fontWeight={700}>{formatDate(selectedBooking.check_out)}</Typography>
              </Box>
              <Box className="booking-summary">
                <Typography color="text.secondary">Guests</Typography>
                <Typography fontWeight={700}>{selectedBooking.guests}</Typography>
              </Box>
              <Box className="booking-summary">
                <Typography color="text.secondary">Total Price</Typography>
                <Typography fontWeight={700}>
                  {formatCurrency(selectedBooking.total_price)}
                </Typography>
              </Box>
              <Box className="booking-summary">
                <Typography color="text.secondary">Status</Typography>
                <Chip
                  color={getBookingStayStatusChipColor(getBookingStayStatus(selectedBooking))}
                  label={getBookingStayStatus(selectedBooking)}
                  size="small"
                />
              </Box>
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          {selectedBooking && (
            <Button
              component={RouterLink}
              to={`/customers/${encodeURIComponent(selectedBooking.customer_email)}/history`}
              onClick={handleCloseBookingDialog}
            >
              View Customer History
            </Button>
          )}
          <Button onClick={handleCloseBookingDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StaffDashboardPage
