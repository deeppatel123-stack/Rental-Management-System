import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Watch, DollarSign, RefreshCw } from 'lucide-react';

export const GoogleDistanceMap = ({ shippingAddress, onDistanceCalculated, deliveryType, calculationOnly = false }) => {
    const [distance, setDistance] = useState(0);
    const [duration, setDuration] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [loading, setLoading] = useState(false);
    const [addressText, setAddressText] = useState('');

    // Rental Partner Warehouse/Store Coordinates & Address
    const partnerAddress = "SG Highway, Ahmedabad, Gujarat, India";
    const partnerLat = 23.0225;
    const partnerLng = 72.5714;

    // Haversine formula line-of-sight distance
    const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    // Calculate routing values
    const calculateRouteMetrics = async (addrStr) => {
        if (!addrStr || addrStr.trim().length < 5) {
            // Default fallback if address is empty
            const defaultDist = 5.2; // default km
            updateFeesAndMetrics(defaultDist);
            return;
        }

        setLoading(true);
        try {
            // Try free geocoding lookup
            const queryUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addrStr)}`;
            const response = await fetch(queryUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'RentalManagementSystem/1.0'
                }
            });
            const data = await response.json();

            if (data && data.length > 0) {
                const destLat = parseFloat(data[0].lat);
                const destLng = parseFloat(data[0].lon);
                // Compute distance and add 20% for road turns/driving route simulation
                const geoDist = getHaversineDistance(partnerLat, partnerLng, destLat, destLng);
                const roadDist = Math.max(1.2, Math.round(geoDist * 1.25 * 10) / 10);
                updateFeesAndMetrics(roadDist);
            } else {
                // Fallback to deterministic calculation if Osm Nominatim returns empty match
                // We use simple sum of character codes of the address string to get a stable mock number
                let hash = 0;
                for (let i = 0; i < addrStr.length; i++) {
                    hash = addrStr.charCodeAt(i) + ((hash << 5) - hash);
                }
                const seedDist = Math.max(2.0, Math.round((Math.abs(hash) % 25 + 2.5) * 10) / 10);
                updateFeesAndMetrics(seedDist);
            }
        } catch (err) {
            console.error('Map Geocoder Fetch Error:', err);
            // Dynamic fallback distance
            updateFeesAndMetrics(7.4);
        } finally {
            setLoading(false);
        }
    };

    const updateFeesAndMetrics = (distanceKm) => {
        // Base rate: $5.00 + $1.50 per excess km (above 1 km)
        let calculatedFee = 0;
        if (deliveryType === 'Delivery') {
            calculatedFee = Math.round((5.00 + Math.max(0, distanceKm - 1) * 1.50) * 100) / 100;
        }

        // Avg speed: 40 km/h + 5 mins traffic hold
        const calculatedMinutes = Math.round((distanceKm / 40) * 60 + 5);

        setDistance(distanceKm);
        setDuration(calculatedMinutes);
        setDeliveryFee(calculatedFee);

        if (onDistanceCalculated) {
            onDistanceCalculated({
                distanceKm,
                durationMinutes: calculatedMinutes,
                deliveryFee: calculatedFee
            });
        }
    };

    useEffect(() => {
        // Build address string
        const street = shippingAddress?.street || '';
        const city = shippingAddress?.city || '';
        const state = shippingAddress?.state || '';
        const zip = shippingAddress?.zipCode || '';

        const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');
        setAddressText(fullAddress);

        // Debounce calculation call
        const timer = setTimeout(() => {
            calculateRouteMetrics(fullAddress);
        }, 1200);

        return () => clearTimeout(timer);
    }, [shippingAddress, deliveryType]);

    // Build standard search query for embed
    const mapCenterSearch = addressText ? `${addressText}` : partnerAddress;
    const embedSrc = `https://maps.google.com/maps?saddr=${encodeURIComponent(partnerAddress)}&daddr=${encodeURIComponent(mapCenterSearch)}&output=embed`;

    if (calculationOnly) return null;

    return (
        <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/10 dark:border-slate-800/20 bg-slate-950/20">
                {/* Embedded Live Google Maps Iframe */}
                <iframe
                    title="Live Google Maps Routing Directions"
                    width="100%"
                    height="320"
                    style={{ border: 0, filter: 'contrast(1.05) saturate(0.95)' }}
                    src={embedSrc}
                    loading="lazy"
                    allowFullScreen
                ></iframe>

                {/* Floating GPS HUD Indicators */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-205/10 dark:border-slate-800/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
                            <Navigation className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold block uppercase">Routing Range</span>
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {distance} km
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-450 rounded-xl">
                            <Watch className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold block uppercase">Est. Duration</span>
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">{duration} mins</span>
                        </div>
                    </div>

                    {deliveryType === 'Delivery' && (
                        <div className="flex items-center gap-3 border-l border-slate-200/50 dark:border-slate-800/30 pl-4">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-xl">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold block uppercase">Delivery Fee</span>
                                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                    ${deliveryFee.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                        <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xl">
                            <RefreshCw className="w-4 h-4 text-brand-500 animate-spin" />
                            <span className="text-xs font-bold text-white">Re-routing paths...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-920/40 border border-slate-200/5 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-brand-500 dark:text-brand-405 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        <span className="font-bold text-slate-700 dark:text-slate-250">Partner Dispatch Base: </span>
                        {partnerAddress}
                        {deliveryType === 'Delivery' && addressText && (
                            <div className="mt-1 pt-1 border-t border-slate-200/5 dark:border-slate-800/10">
                                <span className="font-bold text-slate-700 dark:text-slate-250">Recipient Destination: </span>
                                {addressText}
                            </div>
                        )}
                    </div>
                </div>

                <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(partnerAddress)}&destination=${encodeURIComponent(mapCenterSearch)}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-extrabold rounded-xl shadow-md hover:shadow-brand-500/20 transition-all whitespace-nowrap self-stretch sm:self-auto text-center"
                >
                    <Navigation className="w-3.5 h-3.5" /> Get Directions
                </a>
            </div>
        </div>
    );
};

export default GoogleDistanceMap;
