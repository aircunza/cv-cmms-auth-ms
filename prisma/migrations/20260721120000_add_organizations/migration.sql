BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[organizations] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [code] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [country_code] NVARCHAR(10) NOT NULL,
    [country_name] NVARCHAR(100) NOT NULL,
    [timezone] NVARCHAR(100) NOT NULL,
    [offset_minutes] INT,
    [created_at] DATETIMEOFFSET NOT NULL CONSTRAINT [organizations_created_at_df] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIMEOFFSET NOT NULL CONSTRAINT [organizations_updated_at_df] DEFAULT SYSUTCDATETIME(),
    [is_active] CHAR(1) NOT NULL CONSTRAINT [organizations_is_active_df] DEFAULT 'Y',
    CONSTRAINT [organizations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [organizations_code_key] UNIQUE NONCLUSTERED ([code]),
    CONSTRAINT [organizations_name_key] UNIQUE NONCLUSTERED ([name]),
    CONSTRAINT [organizations_is_active_check] CHECK ([is_active] IN ('Y','N'))
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
