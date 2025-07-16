# Blast Upload Issue Analysis

## Problem Description
User reported that blast file uploads are showing "Application Error" and when successful, only display max bat speed with other metrics showing as null.

## Root Cause Identified
The issue is that **bat speed data is not being saved to the database** during the upload process.

### Evidence from Debug Output
```
[DEBUG] Report data being passed to ReportDisplay: {
  session: {...}, 
  player: {...}, 
  metrics: {
    batSpeed: {
      maxBatSpeed: 67,
      avgBatSpeed: null,        // ❌ Should have value
      avgAttackAngle: null,     // ❌ Should have value  
      avgTimeToContact: null,   // ❌ Should have value
      dataPoints: 374           // ✅ Shows 374 records parsed
    }
  }
}
```

### Database Investigation
- **Session Creation**: ✅ Working correctly
- **Session ID Generation**: ✅ Working correctly  
- **Data Parsing**: ✅ Shows 374 records parsed
- **Data Storage**: ❌ **FAILING** - No bat speed data saved to database

## Technical Analysis

### CSV Parsing Logic
- **Row Skipping**: Correctly skips rows 1-9, starts from row 10 ✅
- **Column Mapping**: 
  - Column H (index 7): Bat Speed ✅
  - Column K (index 10): Attack Angle ✅
  - Column P (index 15): Time to Contact ✅
- **Data Validation**: Only requires bat_speed > 0 ✅

### Transaction Flow
1. ✅ Session created successfully
2. ✅ CSV parsed (374 records)
3. ❌ **Data not saved to database**
4. ✅ Report generated (but with null metrics due to no data)

## Potential Causes

### 1. CSV File Structure Issue
The actual blast CSV file might have a different structure than expected:
- Different number of columns
- Different data format
- Empty or invalid data in expected columns

### 2. Data Validation Failure
The CSV parsing might be filtering out all records due to:
- Invalid bat speed values
- Missing required columns
- Data type conversion issues

### 3. Database Transaction Issue
The transaction might be:
- Rolling back after session creation
- Failing silently during data insertion
- Having foreign key constraint issues

## Next Steps

### Immediate Actions
1. **Add detailed logging** to CSV parsing to see exactly what data is being processed
2. **Check actual CSV file structure** to verify column positions
3. **Add transaction error handling** to catch any database issues
4. **Test with a known good CSV file** to isolate the issue

### Debugging Approach
1. **Log raw CSV data** before parsing
2. **Log parsed records** before database insertion
3. **Log database insertion results**
4. **Verify transaction success/failure**

## Expected Fix
Once the data saving issue is resolved, all metrics should display correctly:
- **Max Bat Speed**: 67+ MPH
- **Avg Bat Speed**: Calculated average
- **Avg Attack Angle**: Calculated average  
- **Avg Time to Contact**: Calculated average
- **Total Swings**: 374 (or actual count)

## Current Status
- **Backend Logic**: ✅ Working correctly
- **Frontend Display**: ✅ Working correctly
- **Data Storage**: ❌ **CRITICAL ISSUE** - Not saving parsed data
- **User Experience**: ❌ Shows incomplete metrics due to missing data 