from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import MOOD_CHOICES, UserProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    age = serializers.IntegerField(required=False, min_value=13, max_value=120)

    class Meta:
        model = User
        fields = ("id", "email", "password", "first_name", "last_name", "age")

    def create(self, validated_data):
        age = validated_data.pop("age", None)
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        UserProfile.objects.create(user=user, age=age)
        return user


class MeSerializer(serializers.ModelSerializer):
    initials = serializers.SerializerMethodField()
    current_mood = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "initials", "current_mood")

    def get_initials(self, obj):
        first = (obj.first_name or "")[:1]
        last = (obj.last_name or "")[:1]
        initials = (first + last).upper()
        return initials or (obj.email[:2].upper() if obj.email else "?")

    def get_current_mood(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.current_mood if profile else ""


class MoodCheckinSerializer(serializers.Serializer):
    mood = serializers.ChoiceField(choices=MOOD_CHOICES)
