BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[user_org_permissions] DROP CONSTRAINT [user_org_permissions_organization_id_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[user_org_permissions] DROP CONSTRAINT [user_org_permissions_user_id_fkey];

-- AddForeignKey
ALTER TABLE [dbo].[user_org_permissions] ADD CONSTRAINT [user_org_permissions_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_org_permissions] ADD CONSTRAINT [user_org_permissions_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
