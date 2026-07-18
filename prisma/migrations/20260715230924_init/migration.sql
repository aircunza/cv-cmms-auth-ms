BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [code] NVARCHAR(255) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [user_name] NVARCHAR(255) NOT NULL,
    [user_short_name] NVARCHAR(70) NOT NULL,
    [password] NVARCHAR(max) NOT NULL,
    [created_at] DATETIMEOFFSET NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIMEOFFSET,
    [is_active] CHAR(1),
    [is_verified] CHAR(1),
    [add_attribute_1] NVARCHAR(255),
    [add_attribute_2] NVARCHAR(255),
    [add_attribute_3] NVARCHAR(255),
    [add_attribute_4] NVARCHAR(255),
    [add_attribute_5] NVARCHAR(255),
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_code_key] UNIQUE NONCLUSTERED ([code]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
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
