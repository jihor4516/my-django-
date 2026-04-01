from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('contracts', '0004_rentalrequest_reviewed_at_rentalrequest_reviewed_by_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Invoice',
        ),
    ]