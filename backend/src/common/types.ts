export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  bio?: string;
  language: string;
  currency: string;
  role: 'guest' | 'host' | 'admin' | 'moderator' | 'support';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  isSuperhost: boolean;
  accountStatus: 'active' | 'suspended' | 'banned' | 'deleted';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  hostId: string;
  title: string;
  description: string;
  propertyType: 'apartment' | 'house' | 'villa' | 'room' | 'studio';
  roomType: 'entire_place' | 'private_room' | 'shared_room';
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  pricePerNight: number;
  cleaningFee: number;
  currency: string;
  minimumNights: number;
  maximumNights: number;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  instantBooking: boolean;
  status: 'draft' | 'pending_approval' | 'active' | 'paused' | 'rejected';
  averageRating: number | null;
  totalReviews: number;
  viewsCount: number;
  address: Address;
  photos: PropertyPhoto[];
  amenities: string[];
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface PropertyPhoto {
  id: string;
  url: string;
  caption?: string;
  order: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalNights: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  propertyTitle: string;
  propertyPhoto: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export type UserPublic = Omit<User, 'passwordHash'>;
export type PropertySummary = Omit<Property, 'reviews'>;
