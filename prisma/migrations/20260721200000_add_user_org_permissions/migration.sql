BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[user_org_permissions] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [organization_id] UNIQUEIDENTIFIER NOT NULL,
    [role_code] NVARCHAR(100) NOT NULL,
    [role_name] NVARCHAR(150) NOT NULL,
    [role_description] NVARCHAR(255) NOT NULL,
    [permissions] NVARCHAR(max) NOT NULL,
    [denied_permissions] NVARCHAR(max),
    [is_active] CHAR(1) NOT NULL CONSTRAINT [user_org_permissions_is_active_df] DEFAULT 'Y',
    [created_at] DATETIMEOFFSET NOT NULL CONSTRAINT [user_org_permissions_created_at_df] DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIMEOFFSET NOT NULL CONSTRAINT [user_org_permissions_updated_at_df] DEFAULT SYSUTCDATETIME(),
    [assigned_at] DATETIMEOFFSET NOT NULL CONSTRAINT [user_org_permissions_assigned_at_df] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [user_org_permissions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_org_permissions_user_id_organization_id_role_code_key] UNIQUE NONCLUSTERED ([user_id],[organization_id],[role_code]),
    CONSTRAINT [user_org_permissions_is_active_check] CHECK ([is_active] IN ('Y','N')),
    CONSTRAINT [user_org_permissions_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT [user_org_permissions_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organizations]([id]) ON DELETE NO ACTION ON UPDATE CASCADE
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [user_org_permissions_user_id_idx] ON [dbo].[user_org_permissions]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [user_org_permissions_organization_id_idx] ON [dbo].[user_org_permissions]([organization_id]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
