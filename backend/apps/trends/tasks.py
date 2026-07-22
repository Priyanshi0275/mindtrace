from celery import shared_task
from django.contrib.auth import get_user_model

from .compute import recompute_trends_for_user

User = get_user_model()


@shared_task
def recompute_all_trends():
    for user in User.objects.all():
        recompute_trends_for_user(user)
