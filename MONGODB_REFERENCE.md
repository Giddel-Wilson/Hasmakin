# MongoDB Quick Reference

## Connection Details
- **Host**: cluster0.oollojt.mongodb.net
- **Database**: hostel_allocation
- **Connection String**: See `.env` file

## Admin Credentials
```
Email: admin@uniport.edu.ng
Password: AdminPassword123!
```

## Common Prisma Commands

### Generate Prisma Client
```bash
bunx prisma generate
```

### Push Schema Changes to Database
```bash
bunx prisma db push
```

### View Database in Prisma Studio
```bash
bunx prisma studio
```

### Seed Database
```bash
bun run prisma/seed.ts
```

## MongoDB Shell Access

If you need to access MongoDB directly:

1. **Using MongoDB Compass** (GUI):
   - Download from: https://www.mongodb.com/try/download/compass
   - Connection String: `mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation`

2. **Using mongosh** (CLI):
   ```bash
   mongosh "mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation"
   ```

## Common MongoDB Queries

### List all collections:
```javascript
show collections
```

### Count documents in a collection:
```javascript
db.users.countDocuments()
db.hostels.countDocuments()
db.applications.countDocuments()
```

### Find all users:
```javascript
db.users.find().pretty()
```

### Find admin users:
```javascript
db.users.find({ role: "ADMIN" }).pretty()
```

### Find all hostels:
```javascript
db.hostels.find().pretty()
```

### Check system settings:
```javascript
db.system_settings.find().pretty()
```

### Find a specific user by email:
```javascript
db.users.findOne({ email: "admin@uniport.edu.ng" })
```

## Important Notes

### ID Format
MongoDB uses ObjectId format (e.g., `68e5243c3207747811dea583`) instead of CUID.

### Payment Amounts
Stored as `Float` instead of `Decimal` - precision is sufficient for currency.

### Relations
Relations are maintained by Prisma at the application level using ObjectId references.

## Troubleshooting

### Connection Issues
1. Check if IP address is whitelisted in MongoDB Atlas
2. Verify connection string in `.env` file
3. Ensure network connectivity

### Schema Issues
1. Run `bunx prisma generate` after schema changes
2. Run `bunx prisma db push` to sync with database
3. Check for validation errors in Prisma schema

### Data Issues
1. Verify data exists: Use MongoDB Compass or mongosh
2. Check indexes: `db.collection.getIndexes()`
3. Review application logs for Prisma errors

## Backup and Restore

### Backup (from MongoDB Atlas)
```bash
# Export specific collection
mongoexport --uri="mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation" --collection=users --out=users_backup.json

# Export entire database
mongodump --uri="mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation" --out=backup_folder
```

### Restore
```bash
# Restore specific collection
mongoimport --uri="mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation" --collection=users --file=users_backup.json

# Restore entire database
mongorestore --uri="mongodb+srv://GiddelWilson:yoegs7v74GJ7Jqcy@cluster0.oollojt.mongodb.net/hostel_allocation" backup_folder/hostel_allocation
```

## Performance Monitoring

### Via MongoDB Atlas Dashboard:
1. Go to https://cloud.mongodb.com
2. Select your cluster
3. View Metrics tab for:
   - Query performance
   - Connection stats
   - Storage usage
   - Index usage

### Via Application:
Prisma logs queries in development mode (see console output).

## Security Best Practices

1. ✅ Use environment variables for credentials
2. ✅ Never commit `.env` file
3. ⚠️ Rotate database password regularly
4. ⚠️ Set up IP whitelist in MongoDB Atlas
5. ⚠️ Enable database audit logs
6. ⚠️ Use separate databases for dev/staging/production

## Resources

- **MongoDB Documentation**: https://docs.mongodb.com
- **Prisma + MongoDB**: https://www.prisma.io/docs/concepts/database-connectors/mongodb
- **MongoDB Atlas**: https://cloud.mongodb.com
- **MongoDB Compass**: https://www.mongodb.com/products/compass

---
Created: October 7, 2025
