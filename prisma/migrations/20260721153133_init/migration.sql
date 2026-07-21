BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[organizations] DROP CONSTRAINT [organizations_created_at_df],
[organizations_updated_at_df];
ALTER TABLE [dbo].[organizations] ADD CONSTRAINT [organizations_created_at_df] DEFAULT CURRENT_TIMESTAMP FOR [created_at], CONSTRAINT [organizations_updated_at_df] DEFAULT CURRENT_TIMESTAMP FOR [updated_at];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
