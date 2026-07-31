/**
 * Pahela Kadam School — Google Apps Script Form Handler
 *
 * Receives POST submissions from contact.html and internship.html
 * and routes them to separate sheets in the same Google Spreadsheet.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Spreadsheet
 * 2. Create two sheets (tabs): "Contact" and "Internship"
 * 3. Add column headers in row 1 of each sheet (see below)
 * 4. Go to Extensions → Apps Script
 * 5. Paste this entire file, overwriting any existing code
 * 6. Click Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy the deployment URL
 * 8. Paste it into GOOGLE_SCRIPT_URL in both contact.html and internship.html
 *
 * CONTACT SHEET HEADERS (row 1):
 * Timestamp | Full Name | Email Address | Phone Number | Subject | Message
 *
 * INTERNSHIP SHEET HEADERS (row 1):
 * Timestamp | Email | Name | Gender | Date of Birth | Contact No. | Email Address | Address | City | State | Pincode | Highest Qualification | Institution Name | Year of Passing | Major/Field of Study | Program Type | Preferred Duration | Skills/Interests | Statement of Purpose | Consent Confirmed | Date of Application
 */

// ========================================================
// CONFIGURATION
// ========================================================
var SHEET_CONTACT = "Contact";
var SHEET_INTERNSHIP = "Internship";

// Stores the spreadsheet ID after first creation
var SPREADSHEET_ID = "";

// ========================================================
// GET OR CREATE SPREADSHEET (for standalone Apps Script)
// ========================================================
function getSpreadsheet() {
  // If we already have an ID stored, use it
  var props = PropertiesService.getScriptProperties();
  var storedId = props.getProperty("SPREADSHEET_ID");

  if (storedId) {
    try {
      return SpreadsheetApp.openById(storedId);
    } catch (e) {
      // ID is stale, fall through to create a new one
    }
  }

  // Create a new spreadsheet
  var ss = SpreadsheetApp.create("Pahela Kadam - Form Submissions");
  props.setProperty("SPREADSHEET_ID", ss.getId());

  // Set up Contact sheet with headers (matching website labels exactly)
  var contactSheet = ss.insertSheet(SHEET_CONTACT);
  contactSheet.appendRow([
    "Timestamp",
    "Full Name",
    "Email Address",
    "Phone Number",
    "Subject",
    "Message",
  ]);

  // Set up Internship sheet with headers (matching website labels exactly)
  var internSheet = ss.insertSheet(SHEET_INTERNSHIP);
  internSheet.appendRow([
    "Timestamp",
    "Email",
    "Name",
    "Gender",
    "Date of Birth",
    "Contact No.",
    "Email Address",
    "Address",
    "City",
    "State",
    "Pincode",
    "Highest Qualification",
    "Institution Name",
    "Year of Passing",
    "Major/Field of Study",
    "Program Type",
    "Preferred Duration",
    "Skills/Interests",
    "Statement of Purpose",
    "Consent Confirmed",
    "Date of Application",
  ]);

  // Delete the default empty "Sheet1"
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet) ss.deleteSheet(defaultSheet);

  return ss;
}

// ========================================================
// POST HANDLER — routes payload to correct sheet
// ========================================================
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // Handle cases where postData might be in different formats
    var rawContents = "";
    if (e.postData && e.postData.contents) {
      rawContents = e.postData.contents;
    } else if (e.parameter && e.parameter.data) {
      rawContents = e.parameter.data;
    } else {
      throw new Error("No POST data received");
    }

    var data = JSON.parse(rawContents);
    var formType = data.formType || "contact";
    var ss = getSpreadsheet();
    var sheet;

    // Route to correct sheet
    if (formType === "internship") {
      sheet = ss.getSheetByName(SHEET_INTERNSHIP);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_INTERNSHIP);
        sheet.appendRow([
          "Timestamp",
          "Email",
          "Name",
          "Gender",
          "Date of Birth",
          "Contact No.",
          "Email Address",
          "Address",
          "City",
          "State",
          "Pincode",
          "Highest Qualification",
          "Institution Name",
          "Year of Passing",
          "Major/Field of Study",
          "Program Type",
          "Preferred Duration",
          "Skills/Interests",
          "Statement of Purpose",
          "Consent Confirmed",
          "Date of Application",
        ]);
      }
      sheet.appendRow([
        new Date(),
        data.sysEmail || "",
        data.name || "",
        data.gender || "",
        data.dob || "",
        data.contactNo || "",
        data.emailAddress || "",
        data.address || "",
        data.city || "",
        data.state || "",
        data.pincode || "",
        data.highestQualification || "",
        data.institutionName || "",
        data.yearOfPassing || "",
        data.major || "",
        data.programs || "",
        data.durations || "",
        data.skills || "",
        data.sop || "",
        data.consent || "",
        data.appDate || "",
      ]);
    } else {
      // Default: contact form
      sheet = ss.getSheetByName(SHEET_CONTACT);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_CONTACT);
        sheet.appendRow([
          "Timestamp",
          "Full Name",
          "Email Address",
          "Phone Number",
          "Subject",
          "Message",
        ]);
      }
      sheet.appendRow([
        new Date(),
        data.name || "",
        data.email || "",
        data.phone || "",
        data.subject || "",
        data.message || "",
      ]);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success" }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Log error to spreadsheet for debugging
    try {
      var ss = getSpreadsheet();
      var logSheet = ss.getSheetByName("ErrorLog");
      if (!logSheet) {
        logSheet = ss.insertSheet("ErrorLog");
        logSheet.appendRow(["Timestamp", "Error", "RawData"]);
      }
      logSheet.appendRow([
        new Date(),
        error.toString(),
        e.postData && e.postData.contents
          ? e.postData.contents.substring(0, 500)
          : "no postData",
      ]);
    } catch (logErr) {
      // Ignore logging errors
    }
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: error.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ========================================================
// GET HANDLER — for testing and diagnostics
// ========================================================
function doGet(e) {
  var ss = getSpreadsheet();

  // If ?action=debug, return sheet contents for verification
  if (e && e.parameter && e.parameter.action === "debug") {
    var contactSheet = ss.getSheetByName(SHEET_CONTACT);
    var internSheet = ss.getSheetByName(SHEET_INTERNSHIP);
    var contactData = contactSheet
      ? contactSheet.getDataRange().getValues()
      : [];
    var internData = internSheet ? internSheet.getDataRange().getValues() : [];
    return ContentService.createTextOutput(
      JSON.stringify({
        result: "success",
        spreadsheetId: ss.getId(),
        spreadsheetUrl: ss.getUrl(),
        contactRows: contactData.length,
        contactData: contactData,
        internshipRows: internData.length,
        internshipData: internData,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      result: "success",
      message: "Pahela Kadam form handler is live.",
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}
