-- Art Commission System Database Schema

-- Users table
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL, -- Should be hashed
    Email NVARCHAR(100) NOT NULL UNIQUE,
    ProfilePicture NVARCHAR(255),
    Banner NVARCHAR(255),
    Description NTEXT,
    IsVIP BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Discount Codes table
CREATE TABLE DiscountCodes (
    DiscountID INT PRIMARY KEY IDENTITY(1,1),
    Code NVARCHAR(20) NOT NULL UNIQUE,
    DiscountPercentage DECIMAL(5,2) NOT NULL,
    MaxUses INT,
    CurrentUses INT DEFAULT 0,
    ExpiryDate DATETIME,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Services table (for different commission types)
CREATE TABLE Services (
    ServiceID INT PRIMARY KEY IDENTITY(1,1),
    ServiceName NVARCHAR(100) NOT NULL,
    Description NTEXT,
    BasePrice DECIMAL(10,2) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Service Options table (for customizable aspects of services)
CREATE TABLE ServiceOptions (
    OptionID INT PRIMARY KEY IDENTITY(1,1),
    ServiceID INT FOREIGN KEY REFERENCES Services(ServiceID),
    OptionName NVARCHAR(100) NOT NULL,
    Description NTEXT,
    PriceFormula NVARCHAR(255), -- Text representation of price calculation formula
    MinValue INT,
    MaxValue INT,
    IsActive BIT DEFAULT 1
);

-- Commission Requests table
CREATE TABLE Requests (
    RequestID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    ServiceID INT FOREIGN KEY REFERENCES Services(ServiceID),
    Description NTEXT NOT NULL,
    CharacterCount INT DEFAULT 1,
    AlternativeCount INT DEFAULT 0,
    PoseCount INT DEFAULT 1,
    References NTEXT, -- JSON array of reference image URLs
    IsNSFW BIT DEFAULT 0,
    TotalPrice DECIMAL(10,2),
    RequestDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'Requested', -- Requested, Accepted, Rejected
    DiscountID INT FOREIGN KEY REFERENCES DiscountCodes(DiscountID),
    AppliedDiscount DECIMAL(10,2) DEFAULT 0
);

-- Commissions table (accepted requests)
CREATE TABLE Commissions (
    CommissionID INT PRIMARY KEY IDENTITY(1,1),
    RequestID INT FOREIGN KEY REFERENCES Requests(RequestID),
    Status NVARCHAR(20) DEFAULT 'Accepted', -- Accepted, Working, Waiting, Finished
    Progress NVARCHAR(20) DEFAULT 'Sketching', -- Sketching, Lineart, Coloring, Shading, Rendering
    ExpectedCompletionDate DATETIME,
    ActualCompletionDate DATETIME,
    Complexity NVARCHAR(20), -- Low, Mid, High, Ultra High, Sistine Chapel
    IsPublicWork BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Commission Updates table
CREATE TABLE CommissionUpdates (
    UpdateID INT PRIMARY KEY IDENTITY(1,1),
    CommissionID INT FOREIGN KEY REFERENCES Commissions(CommissionID),
    UpdateTitle NVARCHAR(100),
    Description NTEXT,
    ImagePath NVARCHAR(255),
    VideoPath NVARCHAR(255),
    UpdateDate DATETIME DEFAULT GETDATE()
);

-- Tags table
CREATE TABLE Tags (
    TagID INT PRIMARY KEY IDENTITY(1,1),
    TagName NVARCHAR(50) NOT NULL UNIQUE
);

-- Commission Tags relationship
CREATE TABLE CommissionTags (
    CommissionID INT FOREIGN KEY REFERENCES Commissions(CommissionID),
    TagID INT FOREIGN KEY REFERENCES Tags(TagID),
    PRIMARY KEY (CommissionID, TagID)
);

-- Insert default "Normal Art Commission" service
INSERT INTO Services (ServiceName, Description, BasePrice)
VALUES ('Normal Art Commission', 'Standard art commission with customizable options for characters, poses, and alternatives.', 35.00);

-- Insert service options for "Normal Art Commission"
INSERT INTO ServiceOptions (ServiceID, OptionName, Description, PriceFormula, MinValue, MaxValue)
VALUES 
((SELECT ServiceID FROM Services WHERE ServiceName = 'Normal Art Commission'), 
'Additional Characters', 
'Each additional character in the artwork beyond the first one', 
'+3+([value]*2)', 
0, 
9);  -- Max 10 characters total (1 base + 9 additional)

INSERT INTO ServiceOptions (ServiceID, OptionName, Description, PriceFormula, MinValue, MaxValue)
VALUES 
((SELECT ServiceID FROM Services WHERE ServiceName = 'Normal Art Commission'), 
'Alternative Versions', 
'Variations that keep the same composition but change details', 
'+3*[value]', 
0, 
10);

INSERT INTO ServiceOptions (ServiceID, OptionName, Description, PriceFormula, MinValue, MaxValue)
VALUES 
((SELECT ServiceID FROM Services WHERE ServiceName = 'Normal Art Commission'), 
'Additional Poses', 
'Different poses (more than 30% change, excluding face) for characters', 
'+5+[value]', 
0, 
10); 