BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[user_org_permissions] DROP CONSTRAINT [user_org_permissions_assigned_at_df],
[user_org_permissions_created_at_df],
[user_org_permissions_updated_at_df];
ALTER TABLE [dbo].[user_org_permissions] ADD CONSTRAINT [user_org_permissions_assigned_at_df] DEFAULT CURRENT_TIMESTAMP FOR [assigned_at], CONSTRAINT [user_org_permissions_created_at_df] DEFAULT CURRENT_TIMESTAMP FOR [created_at], CONSTRAINT [user_org_permissions_updated_at_df] DEFAULT CURRENT_TIMESTAMP FOR [updated_at];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
