from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='systemsettings',
            name='default_language',
            field=models.CharField(choices=[('ar', 'AR'), ('fr', 'FR'), ('en', 'EN')], default='ar', max_length=8),
        ),
    ]