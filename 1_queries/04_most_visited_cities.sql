SELECT properties.city, COUNT(reservations.id) as total_reservations
FROM properties
INNER JOIN reservations ON reservations.property_id = properties.id
GROUP BY city
ORDER BY COUNT(reservations.id) DESC;