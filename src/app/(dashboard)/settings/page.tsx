'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  Clock,
  DollarSign,
  Bell,
  Users,
  Shield,
  Save,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [businessSettings, setBusinessSettings] = useState({
    businessName: 'PetGroom Pro',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    phone: '(555) 123-4567',
    email: 'info@petgroompro.com',
    website: 'www.petgroompro.com',
  })

  const [operatingHours, setOperatingHours] = useState({
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '17:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: true },
  })

  const [bookingSettings, setBookingSettings] = useState({
    bookingLeadTime: 24,
    maxAdvanceBooking: 30,
    slotDuration: 15,
    allowOnlineBooking: true,
    requireDeposit: false,
    depositAmount: 25,
  })

  const [loyaltySettings, setLoyaltySettings] = useState({
    enabled: true,
    pointsPerDollar: 1,
    pointsValue: 0.01,
    welcomeBonus: 50,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    appointmentReminders: true,
    reminderTime: 24,
    vaccinationAlerts: true,
    marketingEmails: false,
    smsNotifications: true,
  })

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully!`)
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your business settings and preferences</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="business" className="space-y-4">
        <TabsList>
          <TabsTrigger value="business">
            <Building2 className="mr-2 h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="mr-2 h-4 w-4" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="booking">
            <DollarSign className="mr-2 h-4 w-4" />
            Booking
          </TabsTrigger>
          <TabsTrigger value="loyalty">
            <Users className="mr-2 h-4 w-4" />
            Loyalty
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Your business details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={businessSettings.businessName}
                  onChange={(e) =>
                    setBusinessSettings({ ...businessSettings, businessName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={businessSettings.address}
                  onChange={(e) =>
                    setBusinessSettings({ ...businessSettings, address: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={businessSettings.city}
                    onChange={(e) =>
                      setBusinessSettings({ ...businessSettings, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={businessSettings.state}
                    onChange={(e) =>
                      setBusinessSettings({ ...businessSettings, state: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input
                    value={businessSettings.zipCode}
                    onChange={(e) =>
                      setBusinessSettings({ ...businessSettings, zipCode: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={businessSettings.phone}
                    onChange={(e) =>
                      setBusinessSettings({ ...businessSettings, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={businessSettings.email}
                    onChange={(e) =>
                      setBusinessSettings({ ...businessSettings, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={businessSettings.website}
                  onChange={(e) =>
                    setBusinessSettings({ ...businessSettings, website: e.target.value })
                  }
                />
              </div>
              <Button onClick={() => handleSave('Business')}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operating Hours */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>Set your business hours for each day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {days.map((day) => (
                <div key={day} className="flex items-center gap-4 py-2 border-b">
                  <div className="w-24 capitalize font-medium">{day}</div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!operatingHours[day as keyof typeof operatingHours].closed}
                      onCheckedChange={(checked) =>
                        setOperatingHours({
                          ...operatingHours,
                          [day]: { ...operatingHours[day as keyof typeof operatingHours], closed: !checked },
                        })
                      }
                    />
                    <span className="text-sm text-gray-500">
                      {operatingHours[day as keyof typeof operatingHours].closed ? 'Closed' : 'Open'}
                    </span>
                  </div>
                  {!operatingHours[day as keyof typeof operatingHours].closed && (
                    <>
                      <Input
                        type="time"
                        value={operatingHours[day as keyof typeof operatingHours].open}
                        onChange={(e) =>
                          setOperatingHours({
                            ...operatingHours,
                            [day]: { ...operatingHours[day as keyof typeof operatingHours], open: e.target.value },
                          })
                        }
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={operatingHours[day as keyof typeof operatingHours].close}
                        onChange={(e) =>
                          setOperatingHours({
                            ...operatingHours,
                            [day]: { ...operatingHours[day as keyof typeof operatingHours], close: e.target.value },
                          })
                        }
                        className="w-32"
                      />
                    </>
                  )}
                </div>
              ))}
              <Button onClick={() => handleSave('Hours')}>
                <Save className="mr-2 h-4 w-4" />
                Save Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Settings */}
        <TabsContent value="booking">
          <Card>
            <CardHeader>
              <CardTitle>Booking Settings</CardTitle>
              <CardDescription>Configure online booking preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Online Booking</Label>
                  <p className="text-sm text-gray-500">Allow clients to book online</p>
                </div>
                <Switch
                  checked={bookingSettings.allowOnlineBooking}
                  onCheckedChange={(checked) =>
                    setBookingSettings({ ...bookingSettings, allowOnlineBooking: checked })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Lead Time (hours)</Label>
                  <Input
                    type="number"
                    value={bookingSettings.bookingLeadTime}
                    onChange={(e) =>
                      setBookingSettings({
                        ...bookingSettings,
                        bookingLeadTime: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Advance (days)</Label>
                  <Input
                    type="number"
                    value={bookingSettings.maxAdvanceBooking}
                    onChange={(e) =>
                      setBookingSettings({
                        ...bookingSettings,
                        maxAdvanceBooking: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slot Duration (min)</Label>
                  <Input
                    type="number"
                    value={bookingSettings.slotDuration}
                    onChange={(e) =>
                      setBookingSettings({
                        ...bookingSettings,
                        slotDuration: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Deposit</Label>
                  <p className="text-sm text-gray-500">Require deposit for bookings</p>
                </div>
                <Switch
                  checked={bookingSettings.requireDeposit}
                  onCheckedChange={(checked) =>
                    setBookingSettings({ ...bookingSettings, requireDeposit: checked })
                  }
                />
              </div>
              {bookingSettings.requireDeposit && (
                <div className="space-y-2">
                  <Label>Deposit Amount ($)</Label>
                  <Input
                    type="number"
                    value={bookingSettings.depositAmount}
                    onChange={(e) =>
                      setBookingSettings({
                        ...bookingSettings,
                        depositAmount: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              )}
              <Button onClick={() => handleSave('Booking')}>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Settings */}
        <TabsContent value="loyalty">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Program</CardTitle>
              <CardDescription>Configure your loyalty rewards program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Loyalty Program</Label>
                  <p className="text-sm text-gray-500">Reward returning customers</p>
                </div>
                <Switch
                  checked={loyaltySettings.enabled}
                  onCheckedChange={(checked) =>
                    setLoyaltySettings({ ...loyaltySettings, enabled: checked })
                  }
                />
              </div>
              {loyaltySettings.enabled && (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Points per $1 Spent</Label>
                      <Input
                        type="number"
                        value={loyaltySettings.pointsPerDollar}
                        onChange={(e) =>
                          setLoyaltySettings({
                            ...loyaltySettings,
                            pointsPerDollar: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Point Value ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={loyaltySettings.pointsValue}
                        onChange={(e) =>
                          setLoyaltySettings({
                            ...loyaltySettings,
                            pointsValue: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Welcome Bonus Points</Label>
                      <Input
                        type="number"
                        value={loyaltySettings.welcomeBonus}
                        onChange={(e) =>
                          setLoyaltySettings({
                            ...loyaltySettings,
                            welcomeBonus: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
              <Button onClick={() => handleSave('Loyalty')}>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure alerts and reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Appointment Reminders</Label>
                  <p className="text-sm text-gray-500">Send reminders before appointments</p>
                </div>
                <Switch
                  checked={notificationSettings.appointmentReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      appointmentReminders: checked,
                    })
                  }
                />
              </div>
              {notificationSettings.appointmentReminders && (
                <div className="space-y-2 ml-4">
                  <Label>Reminder Time (hours before)</Label>
                  <Input
                    type="number"
                    value={notificationSettings.reminderTime}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        reminderTime: parseInt(e.target.value),
                      })
                    }
                    className="w-32"
                  />
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Vaccination Alerts</Label>
                  <p className="text-sm text-gray-500">Alert when vaccinations expire</p>
                </div>
                <Switch
                  checked={notificationSettings.vaccinationAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      vaccinationAlerts: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Send text message notifications</p>
                </div>
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      smsNotifications: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-gray-500">Send promotional emails</p>
                </div>
                <Switch
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      marketingEmails: checked,
                    })
                  }
                />
              </div>
              <Button onClick={() => handleSave('Notifications')}>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
